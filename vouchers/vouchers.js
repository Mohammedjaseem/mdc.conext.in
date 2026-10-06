(() => {
  'use strict';
  const API_BASE = 'https://conext.in';
  const VOUCHER_API = '/voucher_redeem/voucher/api/';
  const SESSION_KEY = 'mdc-voucher-session';
  const $ = (id) => document.getElementById(id);
  let session = null;
  let page = 1;
  let editing = null;
  let saving = false;
  let opening = false;
  let listGeneration = 0;
  const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  function errorText(value) {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(errorText).join(' ');
    if (value && typeof value === 'object') return Object.entries(value).map(([key, detail]) => `${key}: ${errorText(detail)}`).join(' ');
    return 'Please try again.';
  }
  function showMessage(text, error = false, target = 'message') {
    $(target).textContent = text;
    $(target).hidden = !text;
    $(target).classList.toggle('error', error);
  }
  function signOut() {
    session = null;
    sessionStorage.removeItem(SESSION_KEY);
    ++listGeneration;
    $('editor').close();
    $('voucher-rows').replaceChildren();
    $('voucher-panel').hidden = true;
    $('sign-out').hidden = true;
    $('login-panel').hidden = false;
    $('password').value = '';
  }
  async function api(path, options = {}) {
    const headers = new Headers(options.headers);
    if (session?.token) headers.set('Authorization', `Token ${session.token}`);
    let response;
    try {
      response = await fetch(API_BASE + path, { ...options, headers, signal: AbortSignal.timeout(30000) });
    } catch {
      throw new Error('Unable to reach Connect. Check your connection and try again.');
    }
    const data = await response.json().catch(() => null);
    if (response.status === 401 && session) {
      signOut();
      showMessage('Your session has expired. Please sign in again.', true);
      throw new Error('Your session has expired. Please sign in again.');
    }
    if (!response.ok || data?.status === false || data?.results?.status === false) {
      throw new Error(errorText(data?.error || data?.message || data?.detail || data || 'The request could not be completed.'));
    }
    if (!data) throw new Error('Connect returned an unexpected response. Please try again.');
    return data;
  }
  function rowsFrom(data) {
    const rows = data.results?.data ?? data.data;
    if (!Array.isArray(rows)) throw new Error('Connect returned an unexpected list. Please try again.');
    return rows;
  }
  function textNode(tag, text, className) {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  async function loadVouchers() {
    const generation = ++listGeneration;
    $('refresh').disabled = true;
    $('previous').disabled = true;
    $('next').disabled = true;
    $('list-state').textContent = 'Loading your vouchers…';
    $('voucher-rows').replaceChildren();
    try {
      const query = new URLSearchParams({ page, page_size: 20, search: $('search').value.trim() });
      const payload = await api(VOUCHER_API + 'my_vouchers_list/?' + query);
      if (generation !== listGeneration) return;
      const rows = rowsFrom(payload);
      for (const voucher of rows) {
        const row = document.createElement('tr');
        const details = document.createElement('td');
        details.append(textNode('strong', voucher.description), textNode('p', voucher.unique_id, 'voucher-id'), textNode('p', `${voucher.type || 'Voucher'} · ${new Date(voucher.request_on).toLocaleDateString('en-IN')}`));
        const amount = textNode('td', money.format(voucher.amount));
        const state = document.createElement('td');
        state.append(textNode('span', voucher.request_status, 'badge'));
        const action = document.createElement('td');
        if (voucher.can_edit === true) {
          const button = textNode('button', 'Edit', 'secondary');
          button.type = 'button';
          button.setAttribute('aria-label', `Edit voucher ${voucher.id}`);
          button.addEventListener('click', () => openEditor(voucher.unique_id, button));
          action.append(button);
        } else {
          action.append(textNode('span', 'Editing closed'));
        }
        row.append(details, amount, state, action);
        $('voucher-rows').append(row);
      }
      $('list-state').textContent = rows.length ? '' : 'No vouchers found.';
      $('page-label').textContent = `Page ${page}`;
      $('previous').disabled = !payload.previous;
      $('next').disabled = !payload.next;
    } catch (error) {
      if (generation === listGeneration) $('list-state').textContent = error.message;
    } finally {
      if (generation === listGeneration) $('refresh').disabled = false;
    }
  }
  function fillOptions(id, rows, selected, currentName) {
    const select = $(id);
    select.replaceChildren(new Option('Select…', ''));
    for (const row of rows) select.add(new Option(row.name, String(row.id)));
    if (selected != null && !rows.some(row => String(row.id) === String(selected))) {
      select.add(new Option(currentName || 'Current selection', String(selected)));
    }
    select.value = selected == null ? '' : String(selected);
  }
  function conditionalFields() {
    $('vendor-field').hidden = !$('is-vendor').checked;
    $('vendor').required = $('is-vendor').checked;
    $('approver-field').hidden = !$('is-pre-approved').checked;
    $('approver').required = $('is-pre-approved').checked;
  }
  function billLinks(bills) {
    $('bill-links').replaceChildren();
    for (const [index, value] of (bills || []).entries()) {
      try {
        const url = new URL(value);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') continue;
        const link = textNode('a', `Bill ${index + 1}`);
        link.href = url.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        const item = document.createElement('li');
        item.append(link);
        $('bill-links').append(item);
      } catch { /* Skip malformed attachment URLs. */ }
    }
    $('existing-bills').hidden = !$('bill-links').children.length;
  }
  async function openEditor(uniqueId = null, button = $('new-voucher')) {
    if (opening) return;
    opening = true;
    const activeSession = session;
    button.disabled = true;
    showMessage('');
    try {
      // Fetch again when Edit is clicked: the manager may already have reviewed it.
      const voucher = uniqueId ? (await api(VOUCHER_API + 'voucher_detail/?voucher_id=' + encodeURIComponent(uniqueId))).data : null;
      if (uniqueId && voucher?.can_edit !== true) {
        await loadVouchers();
        throw new Error('This voucher has been reviewed and can no longer be edited.');
      }
      const [types, vendors, staff] = await Promise.all([
        api('/voucher_redeem/type/api/type_of_requests/'),
        api('/voucher_redeem/vendor/api/vendors_list/'),
        api('/custom_users/api/staff_list_under_org/?all_staff=true'),
      ]);
      if (session !== activeSession) return;
      editing = voucher;
      $('voucher-form').reset();
      showMessage('', false, 'editor-error');
      fillOptions('request-type', rowsFrom(types), voucher?.type_id, voucher?.type);
      fillOptions('vendor', rowsFrom(vendors), voucher?.vendor_id, voucher?.vendor);
      fillOptions('approver', rowsFrom(staff), voucher?.pre_approval_from_id, voucher?.pre_approval_from);
      $('amount').value = voucher?.amount ?? '';
      $('description').value = voucher?.description ?? '';
      $('is-vendor').checked = voucher?.is_vendor_request === true;
      $('is-advance').checked = voucher?.is_advance === true;
      $('is-pre-approved').checked = voucher?.is_pre_approved === true;
      conditionalFields();
      billLinks(voucher?.bills);
      $('editor-title').textContent = voucher ? `Edit voucher #${voucher.id}` : 'New voucher';
      $('editor-note').textContent = voucher ? 'Changes can be saved until your manager reviews this voucher.' : 'Your request will be sent to the appropriate manager for approval.';
      $('save-voucher').textContent = voucher ? 'Save changes' : 'Submit request';
      $('editor').showModal();
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      button.disabled = false;
      opening = false;
    }
  }
  function closeEditor() {
    if (!saving) $('editor').close();
  }
  $('voucher-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (saving) return;
    const amount = Number($('amount').value);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 2147483647) {
      showMessage('Enter a positive whole-number amount.', true, 'editor-error');
      return;
    }
    const files = [...$('files').files];
    if (files.some(file => !['image/jpeg', 'image/png', 'application/pdf'].includes(file.type))) {
      showMessage('Bills must be JPEG, PNG or PDF files.', true, 'editor-error');
      return;
    }
    const body = new FormData();
    if (editing) body.set('unique_id', editing.unique_id);
    body.set('type', $('request-type').value);
    body.set('amount', String(amount));
    body.set('description', $('description').value);
    body.set('is_vendor_request', String($('is-vendor').checked));
    body.set('vendor', $('is-vendor').checked ? $('vendor').value : '');
    body.set('is_advance', String($('is-advance').checked));
    body.set('is_pre_approved', String($('is-pre-approved').checked));
    body.set('pre_approval_from', $('is-pre-approved').checked ? $('approver').value : '');
    for (const file of files) body.append('files', file);
    saving = true;
    $('voucher-fields').disabled = true;
    $('save-voucher').disabled = true;
    $('close-editor').disabled = true;
    $('cancel-editor').disabled = true;
    showMessage('', false, 'editor-error');
    try {
      const result = await api(VOUCHER_API + (editing ? 'edit_voucher_redeem/' : 'reg_voucher_redeem/'), { method: editing ? 'PATCH' : 'POST', body });
      $('editor').close();
      showMessage(result.message || 'Voucher saved successfully.');
      if (!editing) page = 1;
      await loadVouchers();
    } catch (error) {
      // Preserve the entered changes and files on validation/network failure.
      showMessage(error.message, true, 'editor-error');
      if (session && editing) await loadVouchers();
      if (!session) showMessage(error.message, true);
    } finally {
      saving = false;
      $('voucher-fields').disabled = false;
      $('save-voucher').disabled = false;
      $('close-editor').disabled = false;
      $('cancel-editor').disabled = false;
    }
  });
  $('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    $('login-submit').disabled = true;
    showMessage('');
    try {
      const result = await api('/custom_users/api/login/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: $('email').value.trim(), password: $('password').value }),
      });
      if (!result.token || result.profile_type !== 'StaffProfile') throw new Error('Please sign in with an active staff account.');
      session = { token: result.token, name: result.profile_name || result.email };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      $('password').value = '';
      showAccount();
      page = 1;
      await loadVouchers();
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      $('login-submit').disabled = false;
    }
  });
  function showAccount() {
    $('account-name').textContent = session.name;
    $('login-panel').hidden = true;
    $('voucher-panel').hidden = false;
    $('sign-out').hidden = false;
  }
  $('sign-out').addEventListener('click', () => { signOut(); showMessage('You have signed out.'); });
  $('refresh').addEventListener('click', loadVouchers);
  $('new-voucher').addEventListener('click', () => openEditor());
  $('previous').addEventListener('click', () => { --page; loadVouchers(); });
  $('next').addEventListener('click', () => { ++page; loadVouchers(); });
  $('search-form').addEventListener('submit', (event) => { event.preventDefault(); page = 1; loadVouchers(); });
  $('is-vendor').addEventListener('change', conditionalFields);
  $('is-pre-approved').addEventListener('change', conditionalFields);
  $('close-editor').addEventListener('click', closeEditor);
  $('cancel-editor').addEventListener('click', closeEditor);
  $('editor').addEventListener('cancel', (event) => { if (saving) event.preventDefault(); });
  try { session = JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { sessionStorage.removeItem(SESSION_KEY); }
  if (session?.token) { showAccount(); loadVouchers(); }
})();
