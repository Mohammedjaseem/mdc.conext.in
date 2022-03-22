// STICKY NOTE JAVASCRIPT
// REQUIRES: jquery and the following 2 plugins:
// https://gromo.github.io/jquery.scrollbar (required to make the text areas scrollable with a nice scrollbar)
// https://cdnjs.cloudflare.com/ajax/libs/roundSlider/1.3.3/roundslider.min.js (required for note rotation functionality)

(function($) {

  $.stickynotes = function(el, options) {

    var defaults = {
      noteAreaWidth: '90vw',
      noteAreaHeight: '75vh',
      noteAreaBackground: '#eee',
      noteAreaMargin: 5,
      noteWidth: '175px',
      noteHeight: '175px',
      noteMinWidth: 150,
      noteMinHeight: 75,      
      noteBackgroundColor: '#ffc',
      noteRotatable: true,
      noteRotationRange: 15,
      noteOffset: 30,
      noteFontFamily: 'kalam',
      noteFontSize: '22px',
      noteColors: ['#fff', '#ffc', '#fcf', '#fcc', '#ccf', '#cff', '#cfc', '#ccc'],
      fontColors: ['#000', '#aaa', '#f00', '#080', '#00C', '#880', '#808', '#088'],
      updateNote: function(note) { },
      deleteNote: function(note) { }
    };
    
    var plugin = this;
      
    plugin.settings = {};
    
    plugin.$el = $(el);
    plugin.el = el;

    plugin.init = function() {
                      
      plugin.settings = $.extend({}, defaults, options);
           
      plugin.$el.css('width', plugin.settings.noteAreaWidth);
      plugin.$el.css('height', plugin.settings.noteAreaHeight);
      plugin.$el.css('background', plugin.settings.noteAreaBackground);
      
      plugin.$el.toggleClass('sticky-notes', true);
   
      var snAreaContainer = '<div class="sticky-note-area__container"></div>';
      if (plugin.$el.find('.sticky-note').length > 0) { 
        plugin.$el.find('.sticky-note').wrapAll(snAreaContainer);
      } else {
        plugin.$el.append(snAreaContainer);
      }
      plugin.$el.find('.sticky-note').each(function() {
        plugin.add(options, $(this));
      });
            
      // Attach a dragstop event to the closest draggable parent (if any) to
      // update the sticky note containment.
      plugin.$el.closest('.ui-draggable').each(function() { 
        if (!$(this).data('has-sticky-notes')) { 
          $(this).on('dragstop', function(e, ui) {
            if (e.target != this) return;
            updateStickyNoteContainment(e.target);
          });
          $(this).data('has-sticky-notes', true);
        }        
      });
      
      // Attach a resizestop event to the closest resizable parent (if any) to
      // update the sticky note containment
      plugin.$el.closest('.ui-resizable').each(function() {
        if (!$(this).data('has-sticky-notes')) { 
          $(this).on('resizestop', function(e, ui) {
            if (e.target != this) return;
            updateStickyNoteContainment(e.target);
          });
          $(this).data('has-sticky-notes', true);
        }        
      });
      
      // Handle window resize events to also adjust the sticky note containment properties
      $(window).resize(debouncer( function (e) {
        updateStickyNoteContainment(e.target);
      }));
      
      // Update containment for notes that exist at the time of containment, this must be
      // wrapped in a timeout to force this event "re-queue" after the browser has had a chance
      // to finish rendering the plugin      
      setTimeout(function() { updateStickyNoteContainment(); }, 0);
      
    };
      
    // public function to serialize the note into a JSON string - used for persistence if required.
    plugin.getJSONObject = function(note) { 

      var result = {};
      var ta = note.find('textarea:first');

      result.text = ta.val();
      result.top = note.position().top;
      result.left = note.position().left;
      result.width = note.outerWidth();
      result.height = note.outerHeight();
      result.rotation = note.data('sn-rotation');
      result.zindex = note.css('z-index');
      result.backgroundColor = rgb2hex(note.css('background-color'));
      result.color = rgb2hex(ta.css('color'));
      result.fontSize = ta.css('font-size');
      result.fontFamily = ta.css('font-family');
      result.bold = ta.hasClass('sticky-note__text-area--bold');
      
      return result;
      
    }
    
    plugin.add = function(options, element) { 
          
      // Ensure the options have been defined
      if (options === undefined) options = {};
      
      // Initialize the element
      var note;
      if (element !== undefined && typeof(element) == 'object') {
        note = element;
        note.toggleClass('sticky-note-preload', true);
        options.text = note.text();
        options.top = note.data('top');
        options.left = note.data('left');
        options.width = note.data('width');
        options.height = note.data('height');
        options.rotation = note.data('rotation');
        options.zindex = note.data('zindex');
        options.backgroundColor = note.data('background-color');
        options.color = note.data('color');
        options.fontFamily = note.data('font-family');
        options.fontSize = note.data('font-size');
        options.bold = note.data('bold');
        note.html('');  
      } else {
        note = $('<div class="sticky-note sticky-note-preload"></div>');
        plugin.$el.find('.sticky-note-area__container').append(note);
      }
            
      if (!options.text) options.text = '';
      if (!options.width) options.width = plugin.settings.noteWidth;
      if (!options.height) options.height = plugin.settings.noteHeight;
      if (!options.fontFamily) options.fontFamily = plugin.settings.noteFontFamily;
      if (!options.fontSize) options.fontSize = plugin.settings.noteFontSize;
      if (!options.backgroundColor) options.backgroundColor = plugin.settings.noteBackgroundColor;
      if (!options.rotation) options.rotation = 0;
      if (!options.bold) options.bold = false;
      if (!options.zindex) options.zindex = 1;

      // Text Area
      var snText = $('<div class="sticky-note__text" tabindex=1></div>');
      var snTA = $('<textarea class="textarea-scrollbar scrollbar-outer" spellcheck="false"></textarea>');
      snTA.append(options.text);
      snText.append(snTA);

      // Close Icon
      var snClose = $('<div class="sticky-note__close sticky-note__control"></div>');
      var snCloseIcon = $('<i class="far fa-times"></i>');
      snClose.append(snCloseIcon);

      // Resize Note Icon
      var snResize = $('<div class="sticky-note__resize ui-resizable-handle ui-resizable-se sticky-note__control"></div>');
      var snResizeIcon = $('<i class="fas fa-caret-right"></i>');
      snResize.append(snResizeIcon);

      // Rotate 
      var snRotate;
      if (plugin.settings.noteRotatable) {
        snRotate = $('<div class="sticky-note__rotate sticky-note__control"></div>');
        var snRotateIcon = $('<i class="far fa-undo"></i>');
        snRotate.append(snRotateIcon);
      }
      
      // Options Icon
      var snOptions = $('<div class="sticky-note__options sticky-note__control"></div>');
      var snOptionsWrapper = $('<div class="sticky-note__options-wrapper"></div>');
      var snOptionsIcon = $('<i class="far fa-cog"></i>');
      snOptions.append(snOptionsIcon);
      
      // Font Increase Option
      var snFontIncrease = $('<div class="sticky-note__font-increase sticky-note__control"></div>');
      var snFontIncreaseIcon = $('<i class="far fa-font"></i><i class="fas fa-plus"></i>');
      snFontIncrease.append(snFontIncreaseIcon);

      // Font Decrease Option
      var snFontDecrease = $('<div class="sticky-note__font-decrease sticky-note__control"></div>');
      var snFontDecreaseIcon = $('<i class="far fa-font"></i><i class="fas fa-minus"></i>');
      snFontDecrease.append(snFontDecreaseIcon);
      
      // Font Bold Option
      var snFontBold = $('<div class="sticky-note__font-bold sticky-note__control"></div>');
      var snFontBoldIcon = $('<i class="far fa-bold"></i>');
      snFontBold.append(snFontBoldIcon);
      
      // Background Note Color Picker
      var snColorPicker = $('<div class="sticky-note__color-picker sticky-note__control"><i class="far fa-fill-drip"></i></div>');
      var snColorPalette = $('<div class="sticky-note__color-palette"></div>');
      var snColorPalettePanel = $('<div class="sticky-note__color-palette-panel"></div>');
      $.each(plugin.settings.noteColors, function (i) {
        
        var snColor = $('<div class="sticky-note__color"></div>');
        snColor.css('background-color', plugin.settings.noteColors[i]);
        
        // Handle mouse enter color (demo's the color)
        snColor.mouseenter(function() { 
          note.css('background-color', $(this).css('background-color'));
        });
        
        // Handle choose note background color
        snColor.click(function(e) {
          e.stopPropagation();
          var pickedColor = $(this).css('background-color');
          note.css('background-color', pickedColor);
          snColorPicker.data('original-color', pickedColor);
          snColorPalette.hide('fast');
          plugin.settings.updateNote(note);
        });
        snColorPalettePanel.append(snColor);

      });
      snColorPalette.append(snColorPalettePanel);
      snColorPicker.append(snColorPalette);
      
      // Handle mouse enter the color palette area - saves the current note color in case it needs to be restored
      snColorPalette.mouseenter(function() { 
        var oc = note.css('background-color');
        snColorPicker.data('original-color', oc);
      });
      
      // Handle moouse leave the color palette area - restores the previously saved note color and hides the palette
      snColorPalette.mouseleave(function() { 
        if (snColorPalette.is( ":hidden" )) return;
        snColorPalette.hide('fast');
        note.css('background-color', snColorPicker.data('original-color'));
      });

      // Note Font Color Picker
      var snFontColorPicker = $('<div class="sticky-note__font-color-picker sticky-note__control"><i class="far fa-palette"></i></div>');
      var snFontColorPalette = $('<div class="sticky-note__font-color-palette"></div>');
      var snFontColorPalettePanel = $('<div class="sticky-note__font-color-palette-panel"></div>');
      $.each(plugin.settings.fontColors, function (i) {
        
        var snColor = $('<div class="sticky-note__font-color"></div>');
        snColor.css('background-color', plugin.settings.fontColors[i]);
        // Handle mouse enter color (demo's the color)
        snColor.mouseenter(function() { 
          note.find('textarea:first').css('color', $(this).css('background-color'));
        });

        // Handle choose note color
        snColor.click(function(e) {
          e.stopPropagation();
          var pickedColor = $(this).css('background-color');
          note.find('textarea:first').css('color', pickedColor);
          snFontColorPicker.data('original-font-color', pickedColor);
          snFontColorPalette.hide('fast');
          plugin.settings.updateNote(note);
        });
        snFontColorPalettePanel.append(snColor);

      });
      snFontColorPalette.append(snFontColorPalettePanel);
      snFontColorPicker.append(snFontColorPalette);
      
      // Handle mouse enter the color palette area - saves the current font color in case it needs to be restored
      snFontColorPalette.mouseenter(function() { 
        var oc = $(this).closest('.sticky-note').find('textarea:first').css('color');
        snFontColorPicker.data('original-font-color', oc);
      });
      
      // Handle moouse leave the color palette area - restores the previously saved font color and hides the palette
      snFontColorPalette.mouseleave(function() { 
        if (snFontColorPalette.is( ":hidden" )) return;
        snFontColorPalette.hide('fast');
        note.find('textarea:first').css('color', snFontColorPicker.data('original-font-color'));
      });
            
      // Build the options panel
      var snOptionsPanel = $('<div class="sticky-note__options-panel"></div>');
      snOptionsPanel.append(snOptionsWrapper);
      snOptionsWrapper.append(snColorPicker).append(snFontColorPicker).append(snFontIncrease).append(snFontDecrease).append(snFontBold);

      // Build the note itself
      note.html('').append(snText)
        .append(snOptions)
        .append(snOptionsPanel)
        .append(snResize)
        .append(snClose);
      
      // Append the rotate control if enabled
      if (plugin.settings.noteRotatable) { 
        note.append(snRotate);
      }

      // Make the note resizable and set the minimum width and height
      note.resizable({ 
        containment: 'parent',
        handles: {'se': '.sticky-note__resize'},
        minHeight: plugin.settings.noteMinHeight,
        minWidth: plugin.settings.noteMinWidth,
        stop: function(e, ui) { 
          plugin.settings.updateNote(note);
        }
      });

      // Make the note draggable and do not allow it to bne dragged any further up or left than the sticky note area container
      // Note: This will have to be updated every time the widget is moved, this is handled further on
      note.draggable({
        containment: [note.closest('.sticky-note-area__container').offset().left+plugin.settings.noteAreaMargin, 
                      note.closest('.sticky-note-area__container').offset().top+plugin.settings.noteAreaMargin],
        cancel: '.sticky-note__control, .sticky-note__text, .sticky-note__rotate-slider',
        scroll: true,
        stop: function(e, ui) { 
          plugin.settings.updateNote(note);
        }
      });
      
      // Handle Rotate Anti-Clockwise click
      if (plugin.settings.noteRotatable) { 
        snRotate.on('click', function() { 
          // Manually transform back to 0 "straight" without calling the update which will set the data property
          // this will allow the original angle to be restored on hide if the user does not change the rotation angle
          //note.css('transform', 'rotate(0deg)');
          
          // Initialize the note area
          var sna = note.closest('.sticky-note-area__container');
          
          // Clone the note and rotate it back to 0 deg to determine the position for the rotation slider overlay and then remove the clone
          var noteRef = note.clone();
          noteRef.css('visibility','hidden');
          noteRef.css('transform', 'rotate(0deg)');
          sna.append(noteRef);
          var noteTop = noteRef.position().top + sna[0].scrollTop;
          var noteLeft = noteRef.position().left;
          noteRef.remove();     

          // Create a new Rotate Slider and overlay it on top of the current note
          var snRotateSlider = $('<div class="sticky-note__rotate-slider"></div></div>');
          var snRotateSliderControlWrapper = $('<div class="sticky-note__rotate-slider-control-wrapper"></div>');
          var snRotateSliderControl = $('<div class="sticky-note__rotate-slider-control"></div>');
          snRotateSliderControlWrapper.append(snRotateSliderControl)
          snRotateSlider.append(snRotateSliderControlWrapper);

          // Set the location, dimensions and z-index of the overlay and append it to the area container
          snRotateSlider.css('top', noteTop);
          snRotateSlider.css('left', noteLeft);
          snRotateSlider.css('width', note.outerWidth());
          snRotateSlider.css('height', note.outerHeight());
          snRotateSlider.css('z-index', note.css('z-index') + 1);
          sna.append(snRotateSlider);

          // Initialize the round slider control
          var rotationMax = plugin.settings.noteRotationRange * 2;
          
          var initialVal = Number(note.data('sn-rotation')) + plugin.settings.noteRotationRange;
          snRotateSliderControl.roundSlider({
            radius: 75,
            width: 25,
            value: initialVal,
            max: rotationMax,
            animation: false,
            circleShape: "half-bottom",
            showTooltip: false,
            drag: function (args) {
              var newVal = Number(snRotateSliderControl.roundSlider("getValue")) - plugin.settings.noteRotationRange;
              updateRotation(note, newVal);
            },
            stop: function() {
              plugin.settings.updateNote(note);
            }
          });

          // Append a button to reset the rotation
          var snSliderControlReset = $('<div class="rs-slider-reset">Reset</div>');
          snRotateSliderControl.find('.rs-container').append(snSliderControlReset);
          snSliderControlReset.on('click', function() {
            updateRotation(note, 0);
            snRotateSliderControl.roundSlider("option", "animation", "true");
            snRotateSliderControl.roundSlider("setValue", plugin.settings.noteRotationRange);
            setTimeout(function() {
              snRotateSliderControl.roundSlider("option", "animation", "false");  
            }, 150);
            plugin.settings.updateNote(note);
          });

          // Destroy the round slider control when the mouse leaves the area
          // and restore the original rotation angle in the event that the user has not changed anything
          snRotateSlider.on('mouseleave', function() {
            snRotateSlider.remove();
          });
          
        });
      }
      
      // Handle note click by raising the selected note to the foreground
      note.on('mousedown', function() { 
        raiseToForeground(note);
        note.data('sn-init-left', '');
        note.data('sn-init-top', '');
      });

      // Handle Sticky Note Close
      snClose.click(function() {
        plugin.settings.deleteNote(note);
        note.remove();
      });

      // Handle Options - Show / Hide
      snOptions.click(function(e) { 
        var snop = note.find('.sticky-note__options-panel:first');
        if (snop.data('is-open')) { 
          snop.hide("slide", { direction: "left" }, 150);
          snop.data('is-open',false);
        } else {
          snop.show("slide", { direction: "left" }, 150);
          snop.data('is-open',true);
        }
      });

      // Handle Option: Color Picker
      snColorPicker.click(function() {
        snColorPalette.show('fast');
      });
      
      // Handle Option: Font Color Pikcer
      snFontColorPicker.click(function() { 
        snFontColorPalette.show('fast');
      });

      // Handle Option: Font Increase 
      snFontIncrease.click(function() {
        var ta = note.find('textarea');
        var size = parseFloat(getComputedStyle(ta[0]).fontSize);
        size += 2;
        ta.css('font-size', size + 'px');
        ta.css('line-height', size + 'px');
        plugin.settings.updateNote(note);
      });

      // Handle Option: Font Decrease 
      snFontDecrease.click(function() {
        var ta = note.find('textarea');
        var size = parseFloat(getComputedStyle(ta[0]).fontSize);
        size -= 2;
        if (size < 1) size = 1;
        ta.css('font-size', size + 'px');
        ta.css('line-height', size + 'px');
        plugin.settings.updateNote(note);
      });

      // Handle Option: Font Bold
      snFontBold.click(function() { 
        $(this).toggleClass('sticky-note__control--enabled');
        note.find('textarea').toggleClass('sticky-note__text-area--bold');
        plugin.settings.updateNote(note);
      });

      // Handle the left offset of new note placement
      if (options.left === undefined) {
        var l = plugin.settings.noteAreaMargin;
        note.siblings().each(function() {
          var tl = $(this).data('sn-init-left');
          if (tl > l) l = tl;
        });
        l+=plugin.settings.noteOffset;
        note.data('sn-init-left', l);
        options.left = l-plugin.settings.noteOffset;
      }

      // Handle the top offset of new note placement
      if (options.top === undefined) { 
        var t = plugin.settings.noteAreaMargin;
        note.siblings().each(function() {
          var tt = $(this).data('sn-init-top');
          if (tt> t) t = tt;
        });
        t+=plugin.settings.noteOffset;
        note.data('sn-init-top', t);
        options.top = t-plugin.settings.noteOffset;
      }

      // Set all the element options
      if (options.backgroundColor !== undefined) note.css('background-color', options.backgroundColor);
      if (options.color !== undefined) note.find('textarea:first').css('color', options.color);
      if (options.left !== undefined) note.css('left', options.left);
      if (options.top !== undefined) note.css('top', options.top);
      if (options.cssClass !== undefined) note.toggleClass(options.cssClass, true);
      note.css('width', (options.width !== undefined) ? options.width : options.noteWidth);
      note.css('height', (options.height !== undefined) ? options.height : options.noteHeight);
      if (options.fontFamily !== undefined) note.find('textarea').css('font-family', options.fontFamily);
      if (options.fontSize !== undefined) {
        note.find('textarea').css('font-size', options.fontSize); 
        note.find('textarea').css('line-height', options.fontSize);
      }
      if (options.bold) { 
        snFontBold.toggleClass('sticky-note__control--enabled', true);
        note.find('textarea').toggleClass('sticky-note__text-area--bold', true);
      }

      // Turn all of the sticky note textareas into scrollbar elements 
      note.find('.textarea-scrollbar').scrollbar();
            
      // Raise the newly added note to the foreground
      if (options.zindex !== undefined) {
        note.css('z-index', options.zindex);
      }  else {
        raiseToForeground(note); 
      }

      // Set the default rotation - if rotation is enabled
      if (plugin.settings.noteRotatable) updateRotation(note, options.rotation);      
      
      // Remove the preload - This must only be done once the transition duration has elapsed (150ms)
      setTimeout(function() {
        note.toggleClass('sticky-note-preload', false);
      }, 150);

      // Code here for updating note text
      note.on('focusout', function(e) {
        plugin.settings.updateNote(note);
      });
      
      return note;

    }

    // private function updateRotate
    var updateRotation = function(note, value) {
      note.css('transform', 'rotate(' + value + 'deg)');
      note.data('sn-rotation', value);
    }
    
    // private function raiseToForeground
    var raiseToForeground = function(me) { 
      var z = 0;
      me.siblings().each(function() {
        var tz = $(this).css('z-index');
        if (tz> z) z = tz;
      });
      z++;
      var updateRequired = (me.css('z-index') != z);
      me.css('z-index', z);
      if (updateRequired) {
        plugin.settings.updateNote(me);
      }
      
    }
    
    // private function converting rgb to hex
    var rgb2hex = function(orig) {
      var rgb = orig.replace(/\s/g,'').match(/^rgba?\((\d+),(\d+),(\d+)/i);
      return (rgb && rgb.length === 4) ? "#" +
             ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
             ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
             ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : orig;
    }

    //private function debounce
    var debouncer = function(func, timeout) {
      var timeoutID, timeout = timeout || 200;
      return function () {
        var scope = this, args = arguments;
        clearTimeout(timeoutID);
        timeoutID = setTimeout(function () {
          func.apply(scope, Array.prototype.slice.call(args));
        }, timeout );
      }
    }
    
    // private function to update widget containment to be called on on resize events
    var updateStickyNoteContainment = function(element) { 
      setTimeout(function() {
        console.log('updating sticky note containment > ' + plugin.$el.attr('id'));
        var snac = plugin.$el.find('.sticky-note-area__container:first');
        plugin.$el.find('.sticky-note').each(function() {
          var c = [ snac.offset().left+plugin.settings.noteAreaMargin, 
                    snac.offset().top+plugin.settings.noteAreaMargin];
          $(this).draggable('option', 'containment', c);
        });
      }, 300);
    }
    
    plugin.init();
  };
        
  $.fn.stickynotes = function(options) {
    return this.each(function() {
      if (undefined == $(this).data('stickynotes')) {
        var plugin = new $.stickynotes(this, options);
        $(this).data('stickynotes', plugin);
      }
    });
  } 
  
})(jQuery);

/************************************/
/*      DEMO ONLY - JAVASCRIPT      */
/************************************/
$(function() {
  
  // Make the widgets draggable:
  // start function just makes the currently dragged widget have a greater z-index than the other widget
  // stop function just updates a simple counter, used to illustrate event bubbling on note drag stop function.
  $('.test-widget').draggable({
    cancel: '.sticky-note-area__container',
    start: function(e, ui) { 
      var z = 1;
      $('.test-widget').each(function() { 
        if ($(this)[0] != e.target) { 
          var tz = $(this).css('z-index');
          if (tz> z) z = tz;
        }
      });
      z++;
      $(e.target).css('z-index', z);
    },
    stop: function(e, ui) { 
      var e = $(this).find('.wdc');
      
      if (!e.length) { 
        e = $('<div class="wdc" data-wdc="0"></div>'); 
        e.appendTo($(this)); 
      }
      var wdc = Number(e.data('wdc')) + 1;
      e.html('Widget Drag Count = ' + wdc);
      e.data('wdc',wdc);
      
    }
  });

  // Widget button 'Add Sticky Note'
  $('.widget-button-add').click(function() {
    var esn = $(this).closest('.test-widget').find('.example-sticky-notes');
    var c = esn.find('.sticky-note').length;
    esn.data('stickynotes').add({  
      text: 'Note #' + String(++c) + ' - Created from button.'
    });      
  });

  // Widget button 'Clear All Sticky Notes'
  $('.widget-button-clear').click(function() {
    var esn = $(this).closest('.test-widget').find('.example-sticky-notes');
    esn.find('.sticky-note').remove();
  });
  
  // Initialize the sticky notes inside the first widget
  $('#example-sticky-notes-1').stickynotes({
     noteAreaWidth: '55vw',
     noteAreaHeight: '80vh',
     noteWidth: '165px',
     noteHeight: '165px',
     noteRotationRange: 20,
     updateNote: function(note) {
       var jso = $(note.closest('.sticky-notes')).data('stickynotes').getJSONObject(note);
       console.log("updateNote()::", jso);
     },
     deleteNote: function(note) { 
       console.log('Delete note: ' + note.find('textarea:first').text());
     }
  });

  // Initialize the sticky notes inside the second widget
  $('#example-sticky-notes-2').stickynotes({
     noteAreaWidth: '35vw',
     noteAreaHeight: '80vh',
     noteWidth: '300px',
     noteHeight: '300px',
     noteOffset: 50,
     noteRotatable: false
  });

  // Note #3 - Show off note stacking
  $('#example-sticky-notes-1').data('stickynotes').add({
    text: 'Note #3 - Click on the notes behind me to bring them forward.'
  });
  
  // Note #5 - Show off the scrollbar
  var t5 = 'Note #5 - Hover me to see my cool scrollbar ---&gt; '
  for (var i = 0; i < 104; i++) t5+='&nbsp;';
  t5+='<br>Surprise!';
  $('#example-sticky-notes-1').data('stickynotes').add({
    text: t5,
    top: 175,
    left: 250,
    width: 225,
    fontFamily: 'tahoma'
  });

  // Note #6 - Sticky Note with a bunch of custom options
  var noteSix = $('#example-sticky-notes-1').data('stickynotes').add({
    text: 'Note #6 - I have a bunch of options.',
    top: 75,
    left: 500,
    width: '350px',
    height: '210px',
    backgroundColor: '#FCF',
    fontFamily: 'arial',
    fontSize: '1.5em',
    rotation: 5
  });
  noteSix.attr('id','NoteSixID-12345');

  // Note #7 - Sticky Note with a custom CSS Class
  $('#example-sticky-notes-1').data('stickynotes').add({
    text: 'Note #7 - I have a custom css class that makes me bold and gives me a fixed width.',
    cssClass: 'note5-css-class',
    left: 575,
    top: 185,
    rotation: -3
  });
     
});