/*
    feindura - Flat File Content Management System
    Copyright (C) Fabian Vogelsteller [frozeman.de]

    This program is free software;
    you can redistribute it and/or modify it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 3 of the License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
    without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
    See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with this program;
    if not,see <http://www.gnu.org/licenses/>.
*
* java/content.js version 0.57 (requires mootools-core and mootools-more)
*/

// vars
var toolTipsTop, toolTipsBottom, toolTipsLeft, toolTipsRight;
var deactivateType = 'disabled'; // disabled/readonly
var pageContentChanged = false; // used to give a warning, if a page in the editor.php has been changed and not saved
var HTMLEditor;
var subCategoryArrows;
var countSubCategoryArrows = 1;
var listPagesBars = []; // stores all pages li elements


/* GENERAL FUNCTIONS */

// add parameter to a url
function addParameterToUrl(key,value) {

  var parameter = '';
  var newLocation = window.location.href;
  if(window.location.href.indexOf('#') != -1) {
    newLocation = window.location.href.substr(0,window.location.href.indexOf('#'));
    parameter = window.location.href.substr(window.location.href.indexOf('#'));
  }
  newLocation = (newLocation.indexOf('&'+key) != -1) ? newLocation.substr(0,newLocation.indexOf('&'+key)) : newLocation;
  newLocation += '&'+key + '=' + value + parameter;

  return newLocation;
}

// *** ->> TOOLTIPS - functions -----------------------------------------------------------------------------------------------------------------------

/* set toolTips to all objects with a toolTip class */
function setToolTips() {

  //store titles and text
  feindura_storeTipTexts('.toolTipLeft, .toolTipRight, .toolTipTop, .toolTipBottom');

  var tipOptions = {
    content: function(e){
      var content = '';
      if(e.retrieve('tip:title'))
        content = e.retrieve('tip:title');
      if(e.retrieve('tip:text'))
        content += e.retrieve('tip:text');
      return content;
    },
    html: true,
    arrowSize: 10,
    distance: 5,
    motionOnHide: false,
    showDelay: 250
  };

  toolTipsTop = new FloatingTips('.toolTipTop',Object.merge(tipOptions,{
    position: 'top'
  }));
  toolTipsBottom = new FloatingTips('.toolTipBottom',Object.merge(tipOptions,{
    position: 'bottom'
  }));
  toolTipsLeft = new FloatingTips('.toolTipLeft',Object.merge(tipOptions,{
    position: 'left'
  }));
  toolTipsRight = new FloatingTips('.toolTipRight',Object.merge(tipOptions,{
    position: 'right'
  }));
}

// *** ->> SETUP - functions -----------------------------------------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------
// ADD a INPUT FIELD
function addField(containerId,inputName) {

  //var newInput = new Element('input', {name: inputName});

  if(containerId && $(containerId) !== null) {
    var newInput  = new Element('input', {type:'text',name: inputName});
    $(containerId).grab(newInput,'bottom');
    return true;
  } else
    return false;
}

function disableSafeHtml(checkbox) {
  if(checkbox.checked) {
    $('cfg_editorSafeHtml').disabled = false;
    $('cfg_editorSafeHtml').retrieve('fancyform_replacment').removeClass('fancyform_disabled');
  } else {
    $('cfg_editorSafeHtml').disabled = true;
    $('cfg_editorSafeHtml').retrieve('fancyform_replacment').addClass('fancyform_disabled');
  }
}

// ------------------------------------------------------------------------------
// SET UP the REALTIME THUMBNAIL SIZE SCALE, all given vars are the object IDs
function setThumbScale(thumbWidth,thumbWidthScale,thumbHeight,thumbHeightScale) {

  var scaleWidth = function(){
        $(thumbWidthScale).tween('width',$(thumbWidth).get('value'));
      };
  var scaleHeight = function(){
        $(thumbHeightScale).tween('width',$(thumbHeight).get('value'));
      };

  // thumbwidth
  if($(thumbWidth) !== null) {
      $(thumbWidth).addEvents({
        'keyup': scaleWidth,
        'mouseup': scaleWidth
      });
  }

  // thumbheight
  if($(thumbHeight) !== null) {
      $(thumbHeight).addEvents({
        'keyup': scaleHeight,
        'mouseup': scaleHeight
      });
  }
}


// ------------------------------------------------------------------------------
// DISABLE THUMBNAIL SIZE IF RATIO is ON, all given vars are the object IDs
function setThumbRatio(thumbWidth,thumbWidthRatio,thumbHeight,thumbHeightRatio,thumbNoRatio) {

  // thumbwidth
  if($(thumbWidthRatio) !== null) {
      $(thumbWidthRatio).addEvent('click', function() {
          $(thumbHeight).setProperty(deactivateType,deactivateType);
          $(thumbWidth).removeProperty(deactivateType);
      });
  }

  // thumbheight
  if($(thumbHeightRatio) !== null) {
      $(thumbHeightRatio).addEvent('click', function() {
          $(thumbWidth).setProperty(deactivateType,deactivateType);
          $(thumbHeight).removeProperty(deactivateType);
      });
  }

  // no Ratio
  if($(thumbNoRatio) !== null) {
      $(thumbNoRatio).addEvent('click', function() {
          $(thumbWidth).removeProperty(deactivateType);
          $(thumbHeight).removeProperty(deactivateType);
      });
  }
}

// -------------------------------------------------
// -> editFiles
function changeEditFile( site, fileName, status, anchorName ) {
  window.location.href = window.location.pathname + "?site=" + site + "&status=" + status + "&file=" + fileName + "#" + anchorName ;
}

// -------------------------------------------------
// -> on SUBMIT goto ANCHOR
function submitAnchor(formId,anchorName) {

  // IE
  if(Browser.ie6 || Browser.ie7) {
    // get form
    var form = document.getElementById(formId);
    // create new action attribute
    var attr = document.createAttribute('action');
    if(form.getAttributeNode('action').nodeValue.contains('#')) return;
    attr.nodeValue = form.getAttributeNode('action').nodeValue + '#' + anchorName;
    // set new action attribute
    form.setAttributeNode(attr);
  // ALL the OTHERS
  } else {
    if($(formId).getAttribute('action').contains('#')) return;
    $(formId).setAttribute('action',($(formId).getAttribute('action') + '#' + anchorName));
  }
}

// *** ->> CONTENT - functions -----------------------------------------------------------------------------------------------------------------------

// -------------------------------------------------
// remove the checked="checked" property from a selection of elements
function removeChecked(selector) {
  $$(selector).each(function(selection) {
    selection.removeProperty('checked');
  });
}

// -------------------------------------------------
// RESIZE ELEMENTS ON HOVER
function resizeElementsOnHover() {

  // vars
  var startSize = 80;

  $$('.resizeOnHover').each(function(element){
    var orgSize = element.getSize().y;

    element.setStyle('height',startSize);
    element.set('tween',{transition: Fx.Transitions.Quint.easeIn});
    element.addEvents({
      'mouseenter': function(){
        element.tween('height',orgSize);
      },
      'mouseleave': function(){
        element.tween('height',startSize);
      }
    });
  });
}

// -------------------------------------------------
// BLOCK SLIDE IN/OUT
function blockSlider(givenId) {

  var blocksInDiv = '';
  var scrollToElement = new Fx.Scroll(window,{duration: 300,transition: Fx.Transitions.Quint.easeInOut});

  // prepares the given container div id or class
  if(givenId)
    blocksInDiv = givenId + ' ';

  $$(blocksInDiv + '.block').each(function(block,i) {
     var h1SlideButton, slideContent, bottomBorder;

     // gets the <a> tag in the <h1>
     if(block.getElement('h1') !== null && block.getElement('h1').getElement('a')) {

       h1SlideButton = block.getElement('h1').getElement('a');

       block.getElements('div').each(function(passedDiv) {
         // gets slideing content
         if(passedDiv.hasClass('content')) {
           slideContent = passedDiv;
         }
         if(passedDiv.hasClass('bottom')) {
           bottomBorder = passedDiv;
         }
      });

      // -> CREATE the SLIDE EFFECT
      slideContent.set('slide',{
        duration: 500,
        //transition: Fx.Transitions.Pow.easeInOut, //Fx.Transitions.Back.easeInOut
        transition: Fx.Transitions.Quint.easeInOut,
        onComplete: function(el) {
          if(!slideContent.getChildren('textarea.editFiles')[0]) { // necessary for CodeMirror to calculate the size of the Codemirror div
            if(!this.open) {
                slideContent.setStyle('display','none'); // to allow sorting above the slided in box
                this.wrapper.setStyle('height',slideContent.getSize().y);
                //this.open = false;
            } else {
                this.wrapper.setStyle('height','auto'); // mootools creates an container around slideContent, so that it doesn't resize anymore automaticly, so i have to reset height auto for this container
                //this.open = true;
            }

            // move the listPages
            if($('listPagesBlock') !== null) {
              subCategoryArrows();
              // show sub category arrows
              $$('div.subCategoryArrowLine').fade(1);
            }
          }
        }
      });

      // DONT show the content bottom if IE 0-7
      if(Browser.ie6 || Browser.ie7)
        bottomBorder.setStyle('display', 'none');
      if(Browser.ie6 || Browser.ie7 || Browser.ie8)
        slideContent.set('slide',{transition: Fx.Transitions.Pow.easeInOut});

      // -> set click Event for the SLIDE EFFECT to the buttons
      h1SlideButton.addEvent('click', function(e) {
        e.stop();

        // hide sub category arrows
        if($('listPagesBlock') !== null)
          $$('div.subCategoryArrowLine').fade(0);

        if(!slideContent.get('slide').open) {
          scrollToElement.start(window.getPosition().x,block.getPosition().y - 30);
        slideContent.setStyle('display','block'); // to allow sorting above the slided in box (reset)
        block.removeClass('hidden'); // change the arrow
        } else
          block.addClass('hidden'); // change the arrow
        slideContent.slide('toggle');
      });

      // -> hide the block at start, if it has class "hidden"
      if(block.hasClass('hidden'))  {
        slideContent.slide('hide');
        if(!slideContent.getChildren('textarea.editFiles')[0]) // necessary for CodeMirror to calculate the size of the Codemirror div
          slideContent.setStyle('display','none'); // to allow sorting above the slided in box
      }
    } // <-- end go trough blocks
  });
}

// -------------------------------------------------
// BLOCK SLIDE IN/OUT
function inBlockSlider() {

  $$('.inBlockSlider').each(function(inBlockSlider) {

    var inBlockSliderLinks = [];
    $$('.inBlockSliderLink[data-inBlockSlider="'+inBlockSlider.getProperty('data-inBlockSlider')+'"]').each(function(sliderLink) {
        inBlockSliderLinks.push(sliderLink);
    });

    if(typeOf(inBlockSliderLinks[0]) === 'null')
      return;

    var slide = inBlockSlider.get('slide');
    var wrapper = slide.wrapper;

    // transfer insetBlock class to the wrapper
    if(inBlockSlider.hasClass('insetBlock')) {
      inBlockSlider.removeClass('insetBlock');
      wrapper.addClass('insetBlock');
      wrapper.set('fade',{duration:'short'});
    }

    // slides the hotky div in, on start
    if(inBlockSlider.hasClass('hidden')) {
      // hides the wrapper on start
      wrapper.fade('hide');
     slide.hide();
    }

    // sets the SLIDE effect to the SLIDE links
    inBlockSliderLinks.each(function(inBlockSliderLink){
      inBlockSliderLink.addEvent('click', function(e) {
        if(e.target.match('a')) e.stop();

        if(inBlockSlider.hasClass('hidden'))
          wrapper.fade(1);
        else
          wrapper.fade(0);

        inBlockSlider.toggleClass('hidden');
        slide.toggle();
      });
    });
  });
}

/* pageChangedSign function
adds a * to the head and the sideBarMenu link of the page, to show that the page was modified, but not saved yet */
function pageContentChangedSign() {

  submitAnchor('editorForm','editorAnchor');

  if($('editorForm') !== null && !pageContentChanged) {
    $$('.notSavedSign' + $('editorForm').get('class')).each(function(notSavedSign) {
      notSavedSign.setStyle('display','inline');
    });
  }

  pageContentChanged = true;
}

// *** ->> SIDEBARS - functions -----------------------------------------------------------------------------------------------------------------------

// vars
var sidbarMenuTextLength;

function setSidbarMenuTextLength() {
  sidbarMenuTextLength = 0;
  // gets the length of the longest text
  // walk trough all <li> <a> ellements an messure the <span> length
  $$('.sidebarMenu menu li').each(function(passedLi) {
    if(typeOf(passedLi.getElement('a').getElement('span')) === 'null')
      return;
    var textLength = passedLi.getElement('a').getElement('span').offsetWidth;
    if(sidbarMenuTextLength < textLength) {
      sidbarMenuTextLength = textLength + 30; //+ 30 for padding
    }
  });
}

// -------------------------------------------------
// SLIDE IN/OUT and MOUSEOVER RESIZE
function sidebarMenu() {

    setSidbarMenuTextLength();

    $$('.sidebarMenu').each(function(sideBarMenu) {

    // ->> SLIDE IN/OUT on click -------------------------------------------------------------------------------------------
    // gets the <a> tag in the <div class="content"> container and <div class="bottom">

    // gets the upper toogle button
    var slideTopButton = sideBarMenu.getChildren('div.top a')[0];
    // gets the bottom toogle button
    var slideBottomButton = sideBarMenu.getChildren('div.bottom a')[0];
    // gets slideing content
    var slideContent = sideBarMenu.getChildren('div.menuWrapper')[0];


    // creates the slide effect
    slideContent.set('slide',{duration: '750', transition: Fx.Transitions.Pow.easeOut});

    // changes the up and down button class from the <div class="top">
    // so that the picture of the upper Toogle Buttons changes
    slideContent.get('slide').addEvent('complete', function(el) {
        if(!navigator.appVersion.match(/MSIE ([0-6]\.\d)/))
          sideBarMenu.toggleClass('hidden');
    });

    // -> sets the SLIDE EFFECT to the buttons
    slideTopButton.addEvent('click', function(e){
      e.stop();
      slideContent.get('slide').toggle();
    });
    slideBottomButton.addEvent('click', function(e){
      e.stop();
      slideContent.get('slide').toggle();
    });

    // -> HIDE the Menu IF it has CLASS "HIDDEN"
    if(sideBarMenu.hasClass('hidden')) {
      slideContent.get('slide').hide();
    }

    // ->> RESIZE on MouseOver -------------------------------------------------------------------------------------------

    // -> sets the RESIZE-TWEEN to the sideBarMenu
    sideBarMenu.set('tween', {duration: '650', transition: Fx.Transitions.Pow.easeOut});

    slideContent.addEvent('mouseover', function(e){
    e.stop();

    if(sidbarMenuTextLength > 210) {
      sideBarMenu.tween('width', sidbarMenuTextLength);
    } else {
      sideBarMenu.tween('width', 210);
    }
    });
    slideContent.addEvent('mouseout', function(e){
    e.stop();
    sideBarMenu.tween('width', '210');
    });
  });
}

/* ---------------------------------------------------------------------------------- */
// SIDEBAR AJAX REQUEST
// send a HTML request to load the new Sidebar content
function loadSideBarMenu(site,page,category) {

  // vars
  if(!page) page = 0;
  if(!category) category = 0;
  var leftSideBar = $('leftSidebar');

  var jsLoadingCircleContainer = new Element('div', {'class':'leftSidebarLoadingCircle'});
  var removeLoadingCircle;

  // creates the request Object
  var requestCategory = new Request.HTML({
    url:'library/leftSidebar.loader.php',
    method: 'get',
    data: 'site=' + site + '&category=' + category + '&page=' + page + '&loadSideBarMenu=true',
    update: $('sidebarSelection'),

    //-----------------------------------------------------------------------------
    onRequest: function() { //-----------------------------------------------------

        // -> TWEEN leftSidebar
        leftSideBar.set('tween',{duration: 150});
        leftSideBar.tween('left',-200);

        // -> ADD the LOADING CIRCLE
        leftSideBar.grab(jsLoadingCircleContainer,'before');
        removeLoadingCircle = feindura_loadingCircle(jsLoadingCircleContainer, 25, 40, 12, 4, "#999");

    },
    //-----------------------------------------------------------------------------
    onSuccess: function(html) { //-------------------------------------------------

      // -> TWEEN leftSidebar
      leftSideBar.set('tween',{duration: 300});
      leftSideBar.tween('left',0);

      leftSideBar.get('tween').chain(function(){
        // -> REMOVE the LOADING CIRCLE
        jsLoadingCircleContainer.destroy();
        removeLoadingCircle();
      });

      LeavingWithoutSavingWarning();
      sidebarMenu();
      setToolTips();
    },
    //-----------------------------------------------------------------------------
    //Our request will most likely succeed, but just in case, we'll add an
    //onFailure method which will let the user know what happened.
    onFailure: function() { //-----------------------------------------------------
      sideBarMenus.set('html','<div class="alert alert-error">Couldn\'t load the sidebar?</div>');
    }
  });

  // send only the site
  if(!page && !category)
    requestCategory.send('site=' + site);
  // or with the data string
  else
    requestCategory.send();
}

// -------------------------------------------------
// -> THROW a WARNING when user want to LEAVE THE PAGE WITHOUT SAVING
function LeavingWithoutSavingWarning() {
  $$('a').each(function(link) {
    var href = link.getProperty('href');
    var onclick = link.getProperty('onclick');

    // only on external links (not the sideBarMenu page selection or links which open the windowBox)
    if((onclick === null ||
       (onclick !== null &&
        onclick.toString().indexOf('openWindowBox') == -1 &&
        onclick.toString().indexOf('loadSideBarMenu') == -1)) &&
        (href === null ||
        href.toString().indexOf('#') == -1)) {


      link.addEvent('click',function(e) {
        if(pageContentChanged) {
          e.stop();
          openWindowBox('library/views/windowBox/unsavedPage.php?target=' + escape(href),false);
        }
      });
    }
  });
}


// *---------------------------------------------------------------------------------------------------*
//  LOAD (if all pics are loaded)
// *---------------------------------------------------------------------------------------------------*
window.addEvent('load', function() {

    // SCROLL to ANCHORS after loading the pages (should fix problems with slided in blocks)
    var anchorId = window.location.hash.substring(1);
    if($(anchorId) !== null)
      (function(){ new Fx.Scroll(window,{duration:100}).set(0,this.getPosition().y); }).delay(100,$(anchorId));

});

// *---------------------------------------------------------------------------------------------------*
//  DOMREADY
// *---------------------------------------------------------------------------------------------------*
window.addEvent('domready', function() {

  // adds cross browser placeholder support
  new PlaceholderSupport();

  // enable drag selections
  new jsMultipleSelect();

  // slide out elements on hover
  new resizeElementsOnHover();

  // STORES all pages LI ELEMENTS
  listPagesBars = $$('div.block.listPagesBlock li');

  // UPDATE the USER-CACHE every 5 minutes
  (function(){
    new Request({
      url:'library/includes/backend.include.php',
      method: 'get',
      onSuccess: function(html) {
        if(html == 'releaseBlock' && $('contentBlocked') !== null)
          $('contentBlocked').destroy();
      }
    }).send('status=updateUserCache&site='+currentSite+'&page='+currentPage);
  }).periodical(180000);


  // -> CHANGE WEBSITE LANGUAGE by the SELECTION
  if($('websiteLanguageSelection') !== null) {
    $('websiteLanguageSelection').addEvent('change',function() {

      var language = this.getSelected().get('value');
      var newLocation = addParameterToUrl('websiteLanguage',language);

      if(pageContentChanged)
        openWindowBox('library/views/windowBox/unsavedPage.php?target=' + escape(newLocation),false);
      else
        window.location.href = newLocation;
    });
  }


  // *** ->> SIDEBAR MENU -----------------------------------------------------------------------------------------------------------------------

  // ->> SIDEBAR SCROLLES LIKE FIXED
  // ---------------------------
  $$('.staticScroller').each(function(element){
    new StaticScroller(element,{offset:1});
  });

  // ADD .active to links which get clicked
  $$('#leftSidebar a').addEvent('click',function(){
    if(this.hasClass('btn'))
      return;
    $$('#leftSidebar a').removeClass('active');
    this.addClass('active');
  });

  // makes sidebarmenu dynamic
  sidebarMenu();


  // ->> LOG LIST
  // ------------
  if($('sidebarTaskLog') !== null) {

    // vars
    var minHeight = 140;
    var maxHeight = 450;

    var myScroller = new Scroller('sidebarTaskLog', {area: 150, velocity: 0.1});
    myScroller.start();

    // -> adds the TWEEN to the LOG-list
    $('sidebarTaskLog').setStyle('height',minHeight);

    // TWEEN OUT
    $('sidebarTaskLog').addEvent('mouseenter', function() {
      $('sidebarTaskLog').tween('height',maxHeight);
    });
    // TWEEN IN
    $('sidebarTaskLog').addEvent('mouseleave', function() {
      $('sidebarTaskLog').tween('height',minHeight);
    });

    if($('sidbarTaskLogScrollUp') !== null) {
      // TWEEN OUT sidebarScrollUp
      $('sidbarTaskLogScrollUp').addEvent('mouseenter', function() {
        $('sidebarTaskLog').tween('height',maxHeight);
      });
      // TWEEN IN sidebarScrollUp
      $('sidbarTaskLogScrollUp').addEvent('mouseleave', function() {
        $('sidebarTaskLog').tween('height',minHeight);
      });
    }

    if($('sidbarTaskLogScrollDown') !== null) {
      // TWEEN OUT sidebarScrollDown
      $('sidbarTaskLogScrollDown').addEvent('mouseenter', function() {
        $('sidebarTaskLog').tween('height',maxHeight);
      });
      // TWEEN IN sidebarScrollDown
      $('sidbarTaskLogScrollDown').addEvent('mouseleave', function() {
        $('sidebarTaskLog').tween('height',minHeight);
      });
    }
   }

  // *** ->> CONTENT -----------------------------------------------------------------------------------------------------------------------

  // BLOCK SLIDE IN/OUT
  blockSlider();
  inBlockSlider();

  // ADDs SMOOTHSCROLL to ANCHORS
  var smoothAnchorScroll = new Fx.SmoothScroll({
      wheelStops: true,
      duration: 200
  });

  // -------------------------------------------------------------------------------------------
  // TOOLTIPS
  setToolTips();


  // -> RELOAD THE CURRENTVISITORS statistic every 1 minute
  if($('rightSidebar') !== null &&
     typeOf($('rightSidebar').getChildren('.currentVisitorsSideBar')[0]) !== 'null') {
    (function(){
      new Request({
        url:'library/includes/currentVisitors.include.php',
        onSuccess: function(html) {
          if(html) {
            toolTipsLeft.detach('a.toolTipLeft');
            $('rightSidebar').getChildren('.currentVisitorsSideBar')[0].set('html',html);
            feindura_storeTipTexts('a.toolTipLeft');
            toolTipsLeft.attach('a.toolTipLeft');
          } else
            $('rightSidebar').set('html','');
        }
      }).send('status=getCurrentVisitors&request=true'); // getCurrentVisitors status prevents userCache overwriting
    }).periodical(60000);
  }

  // *** ->> ADMIN-MENU -----------------------------------------------------------------------------------------------------------------------

  if($('adminMenu') !== null) {
    // set the style back, which is set for non javascript users
    $('adminMenu').setStyle('width','172px');
    $('adminMenu').setStyle('overflow','hidden');

    // set tween
    $('adminMenu').set('tween',{duration: 350, transition: Fx.Transitions.Quint.easeInOut});

    // add resize tween event
    $('adminMenu').addEvents({
      mouseenter : function() { // resize on mouseover
        $('adminMenu').scrollTo(0,0);
        $('adminMenu').tween('height',($('adminMenu').getChildren('table')[0].offsetHeight + 40) + 'px');
      },
      mouseleave : function() { // resize on onmouseout
        $('adminMenu').tween('height','140px');
      }
    });
  }


  // *** ->> LISTPAGES -----------------------------------------------------------------------------------------------------------------------

  // TWEEN FUNCTIONS in LIST PAGES ---------------------------------------------------------------
  if($$('ul li div.functions') !== null) {

    $$('ul li').each(function(li) {
      var functionsDiv = false;

      // get the .functions div
      li.getElements('div').each(function(divs) {
        if(divs.hasClass('functions')) {
          functionsDiv = divs;
        }
      });

      // add fade in and out event on mouseover
      if(functionsDiv !== false) {
        functionsDiv.set('tween',{duration: '1500', transition: Fx.Transitions.Pow.easeOut});

        li.addEvent('mouseover',function(e) {
          e.stop();

          if(navigator.appVersion.match(/MSIE [0-8]/)) functionsDiv.tween('right','0px');
          else functionsDiv.tween('opacity','1');
        });
        li.addEvent('mouseout',function(e) {
          e.stop();
          if(navigator.appVersion.match(/MSIE [0-8]/)) functionsDiv.tween('right','-150px');
          else functionsDiv.tween('opacity','0.2');
        });

        // HIDE the functions AT STARTUP
        if(navigator.appVersion.match(/MSIE [0-8]/)) functionsDiv.setStyle('right','-150px');
        else functionsDiv.setStyle('opacity','0.2');
      }

    });
  }

  // SELECT PAGES ------------------------------------------------------------------------------
  if($('listPagesBlock') !== null) {
    window.addEvent('keydown',function(e){

      // move the cursor to select pages
      if(typeOf(e.key) != 'null' && (e.key == 'up' || e.key == 'down' ||  e.key == 'enter')) {
        e.stop();

        var pageBefore = null;
        var pageAfter = null;
        var selectedPage = false;

        if($('listPagesFilter').getProperty('value').length === 0)
          listPagesBars = $$('div.block.listPagesBlock li');

        // get the selected page
        listPagesBars.each(function(page){
          if(page.retrieve('selected') === true) {
            selectedPage = page;
            // deselect the old page
            selectedPage.removeClass('active');
            // remove: is selected page
            selectedPage.eliminate('selected');
          }
        });

        // OPEN the page on ENTER
        if(typeOf(e.key) != 'null' && e.key == 'enter' && typeOf(selectedPage) !== 'null' && selectedPage !== false) {
          // e.preventDefault();
          window.location.href = 'index.php?category='+selectedPage.get('data-categoryId')+'&page='+selectedPage.get('data-pageId');
          return;
        }

        // move the selection up or down
        listPagesBars.each(function(curPage,index) {
          if(curPage === selectedPage) {
            pageBefore = listPagesBars[index-1];
            pageAfter = listPagesBars[index+1];
          }
        });
        // move the cursor
        if(typeOf(e) != 'null' && e.key == 'up' && typeOf(pageBefore) !== 'null')
          selectedPage = pageBefore;
        else if(typeOf(e) != 'null' && e.key == 'down' && typeOf(pageAfter) !== 'null')
          selectedPage = pageAfter;

        // select the first if no page was selected
        if(selectedPage === false) {
          selectedPage = listPagesBars[0];
        }


        // mark the selected page
        if(selectedPage !== null && typeOf(selectedPage) !== 'null') {
          selectedPage.addClass('active');
          selectedPage.store('selected',true);

          // slide the current category
          var categoryBlock =  $('category' + selectedPage.get('data-categoryId')).getParent('div.listPagesBlock');
          if(categoryBlock.hasClass('hidden')) {
            categoryBlock.removeClass('hidden'); // change the arrow
            categoryBlock.getElement('div.content').setStyle('display','block'); // to allow sorting above the slided in box (reset)
            categoryBlock.getElement('div.content').slide('show');
            categoryBlock.getElement('div.content').get('slide').wrapper.setStyle('height','auto');
          }
        }
      }
    });
  }

  // FILTER LIST PAGES -------------------------------------------------------------------------
  if($('listPagesFilter') !== null) {
    var cancelListPagesFilter = function(e) {
      if(e) e.stop();

      listPagesBars = $$('div.block.listPagesBlock li');

      $('listPagesFilter').setProperty('value','');
      $('listPagesFilter').fireEvent('keyup');
      $$('.subCategoryArrowLine').setStyle('display','block');
    };
    $('listPagesFilterCancel').addEvent('click',cancelListPagesFilter);
    var storedOpenBlocks = false;
    var openBlocks = [];

    // -> stop moving the cursor on up and down
    $('listPagesFilter').addEvent('keydown',function(e){
      if(e.key == 'up' || e.key == 'down' || e.key == 'enter') {
        e.preventDefault();
      }
    });

    // ->> filter on input
    $('listPagesFilter').addEvent('keyup',function(e){

      // clear on ESC
      if(typeOf(e) != 'null' && e.key == 'esc')
        this.setProperty('value','');

      // vars
      var filter = this.getProperty('value');

      // clear the listPagesBars, to add filtered pages
      if(filter.length > 0) {
        listPagesBars = [];
      }

      // ->> FILTER the PAGES
      if(filter) {

        $$('div.block.listPagesBlock li').each(function(page) {
          var pageTitle = page.getChildren('div div.name a')[0];
          if(typeOf(pageTitle) !== 'null' && pageTitle.get('text').toLowerCase().contains(filter.toLowerCase())) {
            page.setStyle('display','block');
            listPagesBars.push(page);
          } else {
            page.setStyle('display','none');
          }
        });

        // hide empty blocks
        $$('div.block.listPagesBlock').each(function(block) {
          var isEmpty = true;
          block.getElements('li').each(function(li) {
            if(li.getStyle('display') == 'block' && typeOf(li.getChildren('div.emptyList')[0]) == 'null')
              isEmpty = false;
          });

          if(!isEmpty)
            block.setStyle('display','block');
          else
            block.setStyle('display','none');
        });

      // SHOW the category and pages again, when filter is empty
      } else {
        $$('div.block.listPagesBlock li').each(function(page) {
          page.setStyle('display','block');
        });
        $$('div.block.listPagesBlock').each(function(block) {
          block.setStyle('display','block');
        });
      }

      // ->> WHEN filter is started
      // ->> SLIDE all blocks IN
      if(filter.length > 0) {

        // hide subCategory arrows
        $$('.subCategoryArrowLine').setStyle('display','none');

        $('listPagesFilterCancel').setStyle('display','inline');

        $$('div.block.listPagesBlock').each(function(block){
          if(block.hasClass('hidden')) {
            block.removeClass('hidden'); // change the arrow
            block.getElement('div.content').slide('show');
            block.getElement('div.content').setStyle('display','block'); // to allow sorting above the slided in box (reset)
            block.getElement('div.content').get('slide').wrapper.setStyle('height','auto');

          // store the open blocks
          } else if(!storedOpenBlocks) {
            openBlocks.push(block);
          }
        });
        storedOpenBlocks = true;

      // ->> WHEN filter is cleared
      // ->> SLIDE the blocks OUT again, besides the one which was in at the beginning
      } else if(filter === '' && storedOpenBlocks) {

        $('listPagesFilterCancel').setStyle('display','none');

        $$('div.block.listPagesBlock').each(function(block){
          if(!openBlocks.contains(block)) {
            block.addClass('hidden'); // change the arrow
            block.getElement('div.content').slide('hide');
            block.getElement('div.content').setStyle('display','none'); // to allow sorting above the slided in box (reset)
            block.getElement('div.content').get('slide').wrapper.setStyle('height',block.getElement('div.content').getSize().y);
            openBlocks.erase(block);
          }
        });
        // clean the stored blocks array
        if(storedOpenBlocks) {
          openBlocks = [];
          storedOpenBlocks = false;
        }

        cancelListPagesFilter();
      }
    });
  }

  // --------------------------------------------------------------------------------------------
  // SHOW SUBCATEGORY ARROW PAGES ---------------------------------------------------------------
  subCategoryArrows = function() {
      $$('div.subCategoryArrowLine').each(function(arrow){
      countSubCategoryArrows++;

      // vars
      arrow.set('tween', {duration:'short',transition: Fx.Transitions.Quint.easeOut});
      var listPagesBlock        = $('listPagesBlock');
      var parentPage            = $(arrow.get('data-parentPage'));
      var category              = $(arrow.get('data-category')).getParent('div.block');
      var subCategory           = $(arrow.get('data-subCategory')).getParent('div.block');
      var inLineArrow           = arrow.getChildren('.subCategoryInLineArrow')[0];
      // var parentPageArrowStart  = arrow.getChildren('.parentPageArrowStart')[0];
      var arrowStart = arrow.getChildren('.subCategoryArrowStart')[0];
      var arrowEnd              = arrow.getChildren('.subCategoryArrowEnd')[0];
      var top,height = 0;

      // if the subCategory is under the category with the parent page
      if(subCategory.getPosition(listPagesBlock).y > category.getPosition(listPagesBlock).y) {
        top = (parentPage.getPosition(parentPage.getParent('div.block > h1')).y < 0) ? (category.getPosition(listPagesBlock).y + 22): (parentPage.getPosition(listPagesBlock).y + 19);
        height = subCategory.getPosition(listPagesBlock).y - top + 32;

        arrowEnd.removeClass('arrowBottom');
        arrowEnd.addClass('arrowTop');

        arrowStart.removeClass('arrowBottom');
        arrowStart.addClass('arrowTop');

        inLineArrow.removeClass('arrowUp');
        inLineArrow.addClass('arrowDown');

      // if the category with the parent page is under the subCategory
      } else {
        top = subCategory.getPosition(listPagesBlock).y + 23;
        height = (parentPage.getPosition(parentPage.getParent('div.block > h1')).y < 0) ? (category.getPosition(listPagesBlock).y - subCategory.getPosition(listPagesBlock).y ): (parentPage.getPosition(listPagesBlock).y  - subCategory.getPosition(listPagesBlock).y - 6);

        arrowEnd.removeClass('arrowTop');
        arrowEnd.addClass('arrowBottom');

        arrowStart.removeClass('arrowTop');
        arrowStart.addClass('arrowBottom');

        inLineArrow.removeClass('arrowDown');
        inLineArrow.addClass('arrowUp');
      }

      // if category is slided in
      if((parentPage.getPosition(parentPage.getParent('div.block > h1')).y < 0)) {
        // subCategoryArrowStart.setStyle('display','block');
      } else {
        // subCategoryArrowStart.setStyle('display','none');
      }

      // arrow.fade(0);
      // arrow.get('tween').chain(function(){
        arrow.setStyles({
          'display': 'block',
          'top': top,
          'height': height
        });
        // arrow.fade(1);
      // });

      // arrow.morph({'top': top, 'height': subCategory.getPosition(listPagesBlock).y - top + 10});

      if(arrow.getStyle('width') === '0px')
        arrow.setStyle('width',(countSubCategoryArrows * 10));

    });
  };
  subCategoryArrows();
  // window.addEvent('scroll',moveArrow);

  // -------------------------------------------------------------------------------------------
  // LIST PAGES SORTABLE -----------------------------------------------------------------------
  var clicked = false;
  var categoryOld;
  var categoryNew;

  if($('sortablePageList_status') !== null)
    var sortablePageList_status = $('sortablePageList_status').get('value').split("|");

  var preventLink = function (){
      return false;
  };

  var sb = new Sortables('.sortablePageList', {
    /* set options */
    //clone: true,
    revert: true,
    opacity: 1,
    snap: 10,

    /* --> initialization stuff here */
    initialize: function() {

    },
    /* --> once an item is selected */
    onStart: function(el,elClone) {
      // clear all last active pages bars
      $$('.sortablePageList li').each(function(li) {
        li.removeClass('active');
        li.eliminate('selected');
      });
      el.addClass('active');
      el.store('selected',true);

      categoryOld = el.getParent().get('id').substr(8); // gets the category id where the element comes from

    },
    // check if sorted
    onSort: function(el){
      clicked = true;
      $$('.sortablePageList a').each(function(a) { a.addEvent('click',preventLink); }); // prevent clicking the link on sort
    },
    /* --> when a drag is complete */
    onComplete: function(el) {

      subCategoryArrows();

      // --> SAVE SORT ----------------------
      /* nur wenn sortiert wurde wird werden die seiten neu gespeichert */
      if(clicked) {
      clicked = false;

      categoryNew = el.getParent().get('id').substr(8); // gets the category id where the element comes from
      var sortedPageId = el.get('id').substr(4);

      // build a string of the order
      var sort_order = '';
      var count_sort = 0;

      $$('.sortablePageList li').each(function(li) {
        if(li.getParent().get('id') == el.getParent().get('id') && li.get('id') !== null) {
          sort_order = sort_order + li.get('id').substr(4)  + '|'; count_sort++;
        } });
      $('sort_order' + categoryNew).value = sort_order;

      // if pages has changed the category id in the href!
      if(categoryOld != categoryNew) {
        el.getElements('div').each(function(div){
          var newHref,oldHref;

          if(div.hasClass('name')) {
              oldHref = String(div.getElement('a').get('href'));
              newHref = oldHref.replace('category=' + categoryOld,'category=' + categoryNew);
              div.getElement('a').set('href',newHref);
          }

          if(div.hasClass('status')) {
              oldHref = String(div.getElement('a').get('href'));
              newHref = oldHref.replace('category=' + categoryOld,'category=' + categoryNew);
              div.getElement('a').set('href',newHref);
          }

          if(div.hasClass('functions')) {
              div.getElements('a').each(function(a){
                oldHref = String(a.get('href'));
                newHref = oldHref.replace('category=' + categoryOld,'category=' + categoryNew);
                a.set('href',newHref);

                if(a.hasClass('deletePage')) {
                    oldHref = String(a.get('onclick'));
                    newHref = oldHref.replace('category=' + categoryOld,'category=' + categoryNew);
                    a.set('onclick',newHref);
                }
              });
          }
        });
      }

      // --> sortiert die Seite mithilfe einer AJAX anfrage an library/controllers/sortPages.controller.php ------------------------------
        var req = new Request({
          url:'library/controllers/sortPages.controller.php',
          method:'post',
          //autoCancel:true,
          data:'sort_order=' + sort_order + '&categoryOld=' + categoryOld +'&categoryNew=' + categoryNew + '&sortedPageId=' + sortedPageId , // + '&do_submit=1&byajax=1&ajax=' + $('auto_submit').checked
          //-------------------------------------
          onRequest: function() {

            // PUT the save new order - TEXT in the loadingBox AND SHOW the LOADINGBOX
            $('loadingBox').set('html','<span style="color:#D36100;font-weight:bold;font-size:16px;">'+sortablePageList_status[0]+'</span>');
            // set tween
            $('loadingBox').set('tween',{duration: 200});
            $('loadingBox').setStyle('display','block');
            $('loadingBox').setStyle('opacity','1');

          },
          //-------------------------------------
          onSuccess: function(responseText) {

            // FINAL SORT MESSAGE
            //puts the right message which is get from the sortablePageList_status array (hidden input) in the messageBox
            //$('messageBox_input').set('html',sortablePageList_status[responseText.substr(6,1)]);
            $('messageBox_input').set('html','<img src="library/images/icons/hintIcon.png" class="hintIcon"><span style="color:#407287;font-weight:bold;">' + responseText + '</span>');

            // remove prevent clicking the link on sort
            $$('.sortablePageList a').each(function(a) { a.removeEvent('click',preventLink); });

            // remove the "no pages notice" li if there is a page put in this category
            $$('.sortablePageList li').each(function(li) {
              if(li.get('id') === null && li.getParent().get('id').substr(8) == categoryNew && responseText.substr(-1) != '4') {
                li.destroy();
              }
            });

            // adds the "no page - notice" li if the old category is empty
            if(responseText.substr(0,13) == '<span></span>') {
              $$('.sortablePageList').each(function(ul) {
                if(ul.get('id').substr(8) == categoryOld) { // && responseText.substr(-1) != '4'
                  var newLi = new Element('li', {html: '<div class="emptyList">' + sortablePageList_status[1] + '</div>'});
                  newLi.setStyle('cursor','auto');
                  ul.grab(newLi,'top');
                }
              });
            }

            // HIDE the LOADINGBOX
            $('loadingBox').tween('opacity','0');
            $('loadingBox').get('tween').chain(function(){
              $('loadingBox').empty();
              $('loadingBox').setStyle('display','none');
            });

          }
        }).send();

    } // <-- SAVE SORT -- END --------------------
  }
  });

  // makes the "no pages notice" li un-dragable
  $$('.sortablePageList li').each(function(li) {
      if(li.get('id') === null) {
        li.removeEvents();
        li.setStyle('cursor','auto');
      }
  });

  // *** ->> SETUP -----------------------------------------------------------------------------------------------------------------------

  // -> ADD auto grow to textareas which have the "autogrow" class
  $$('textarea.autogrow').each(function(textarea){
    textarea.setStyle('overflow-y','hidden');
    new Form.AutoGrow(textarea);
  });

  // ->> ADMIN-SETUP
  // ---------------

  // -> adds realtime THUMBSCALE to the thumbnail Settings
  setThumbScale('cfg_thumbWidth','thumbWidthScale','cfg_thumbHeight','thumbHeightScale');

  // -> adds THUMBRATIO deactivation
  setThumbRatio('cfg_thumbWidth','ratioX','cfg_thumbHeight','ratioY','noRatio');

  // change enterMode opposite text
  if($('cfg_editorEnterMode') !== null) {
    $('cfg_editorEnterMode').addEvent('change',function() {
      var opposite = $('enterModeOpposite');

      if(opposite !== null) {
        if(opposite.get('html') == '&lt;br&gt;')
          opposite.set('html','&lt;p&gt;');
        else
          opposite.set('html','&lt;br&gt;');
      }
    });
  }

  // -> adds Fields to styleSheetsFilePaths
  $$('.addStyleFilePath').each(function(addButton){
    if(addButton !== null) {
      var containerId = addButton.getParent().getElement('div').getProperty('id');
      var inputName = addButton.getParent().getElement('div').getElement('input').getProperty('name');

      addButton.addEvent('click', function(e) {
        e.stop();
        addField(containerId,inputName);
      });
    }
  });

  // -> DISABLE varNames if SPEAKING URL is selected
  if($('cfg_speakingUrl') !== null) {
    var smallSize = 60;

    $('cfg_speakingUrl').addEvent('change',function() {
      // disables all varNames fields is option value == true; speaking url
      if(this[this.selectedIndex].value == 'true') {
        $('cfg_varNamePage').setProperty(deactivateType,deactivateType);
        $('cfg_varNamePage').tween('width',smallSize);
        $('cfg_varNameCategory').setProperty(deactivateType,deactivateType);
        $('cfg_varNameCategory').tween('width',smallSize);
        //$('cfg_varNameModul').setProperty(deactivateType,deactivateType);
        //$('cfg_varNameModul').tween('width',smallSize);
      // activates thema if link with vars
      } else {
        $('cfg_varNamePage').removeProperty(deactivateType);
        $('cfg_varNamePage').tween('width',320);
        $('cfg_varNameCategory').removeProperty(deactivateType);
        $('cfg_varNameCategory').tween('width',320);
        //$('cfg_varNameModul').removeProperty(deactivateType);
        //$('cfg_varNameModul').tween('width',320);
      }
    });
  }

  // -> DISABLE cache timeout
  if($('cfg_cacheTimeout') !== null) {
    $('cfg_cache').addEvent('change',function() {
      // disable
      if(this.checked) {
        $('cacheTimeoutRow').setStyle('display','block');
      // activate
      } else {
        $('cacheTimeoutRow').setStyle('display','none');
      }
    });
  }

  // ->> PAGE SETUP
  // ---------------

  // -> GO TROUGH every CATEGORY and add thumbScale to the advanced category settings
  if($$('.advancedcategoryConfig') !== null) {
    var countCategories = 0;
    // -----------------------------------------
    // ADD SLIDE TO THE ADVANCED CATEGORY SETTINGS
    // go trough every advancedcategoryConfig class and add the slide effect
    $$('.categoryConfig').each(function(categoryConfig) {
      // count categories
      countCategories++;
      // -----------------------------------------
      // adds realtime THUMBSCALE to the advanced category settings
      setThumbScale('categories'+countCategories+'thumbWidth','categories'+countCategories+'thumbWidthScale','categories'+countCategories+'thumbHeight','categories'+countCategories+'thumbHeightScale');
      // adds THUMBRATIO deactivation
      setThumbRatio('categories'+countCategories+'thumbWidth','categories'+countCategories+'ratioX','categories'+countCategories+'thumbHeight','categories'+countCategories+'ratioY','categories'+countCategories+'noRatio');
    });
  }

  // ----------------------------------------------------
  // ADD CodeMirror TO ALL TEXTAREAs with class editFiles
  $$('textarea.editFiles').each(function(textarea){
    // var
    var hlLine;
    var mode;
    if(textarea.hasClass('css') || textarea.hasClass('php'))
      mode = textarea.getProperty('class').replace('editFiles ','');
    else if(textarea.hasClass('js'))
      mode = 'javascript';
    else
      mode = 'htmlmixed';

    var editor = CodeMirror.fromTextArea(textarea, {
      mode: mode,
      lineNumbers: false,
      theme: 'feindura',
      onCursorActivity: function() {
        editor.setLineClass(hlLine, null);
        hlLine = editor.setLineClass(editor.getCursor().line, "CodeMirrorActiveline");
      }
    });

    // make sure, webkit spellchecking is turned off
    $$('div.CodeMirror textarea').setProperty('spellcheck','false');
  });

  // *** ->> USER SETUP -----------------------------------------------------------------------------------------------------------------------
  if(typeOf($$('input.userAdminCheckbox')[0]) !== 'null') {

    $$('input.userAdminCheckbox').addEvent('change',function(){
      if(this.checked) {
        this.getParent('div.row').getNext('div.userPermissionsRow').setStyle('display','none');
      } else
        this.getParent('div.row').getNext('div.userPermissionsRow').setStyle('display','block');
    });

  }


  // *** ->> FORMS -----------------------------------------------------------------------------------------------------------------------


  // ------------------------------------------------------------
  // ADD FANCY-FORM
  feinduraFancyForm = new FancyForm('input[type="checkbox"], input[type="radio"]');

  // ADD DEPENCIES for CHECKBOXES
  $$('input[type="radio"]').each(function(checkbox) {
    var checkboxId = checkbox.get('id');

    // go trough checkboxes with id
    if(checkboxId) {

      // -> ** categories[0-9]sortByPageDate
      if(checkboxId.match(/^categories[0-9]+sortByPageDate$/)) {
        var categoryNumber = checkboxId.match(/[0-9]+/);
        feinduraFancyForm.setDepency(checkbox,$('categories'+categoryNumber+'showPageDate'));
        feinduraFancyForm.setDepency($('categories'+categoryNumber+'showPageDate'),$('categories'+categoryNumber+'sortByPageDate'),false,false);
      }
    }
  });
  // set depency for page sortingByDate
  feinduraFancyForm.setDepency($('nonCategorySortByPageDate'),$('nonCategoryShowPageDate'));
  feinduraFancyForm.setDepency($('nonCategoryShowPageDate'),$('nonCategorySortByPageDate'),false,false);

  // set depency for page editorHtmlLawed
  feinduraFancyForm.setDepency($('cfg_editorHtmlLawed'),$('cfg_editorSafeHtml'),false,false);


  // *** ->> EDITOR -----------------------------------------------------------------------------------------------------------------------
  if($('HTMLEditor') !== null) {

    // vars
    var editorStartHeight   = window.getSize().y * 0.60;
    var editorToHeight      = (window.getSize().y * 0.60 > 420) ? window.getSize().y * 0.60 : 420;
    var editorHasFocus      = false;
    var editorIsClicked     = false;
    var editorSubmited      = false;
    var editorSubmitHeight  = $('HTMLEditorSubmit').getSize().y;

    // ------------------------------
    // CONFIG the HTMlEditor
    CKEDITOR.config.skin                               = 'BootstrapCK-Skin';
    CKEDITOR.config.width                              = 770;
    CKEDITOR.config.height = ($('documentSaved') !== null && $('documentSaved').hasClass('saved')) ? editorToHeight : editorStartHeight;
    CKEDITOR.config.resize_minWidth                    = 831;
    CKEDITOR.config.resize_maxWidth                    = 1200;
    CKEDITOR.config.resize_minHeight                   = (editorStartHeight+136);
    CKEDITOR.config.resize_maxHeight                   = 900;
    CKEDITOR.config.forcePasteAsPlainText              = false; // was true
    CKEDITOR.config.pasteFromWordNumberedHeadingToList = true;
    CKEDITOR.config.scayt_autoStartup                  = false;
    CKEDITOR.config.colorButton_enableMore             = true;
    CKEDITOR.config.entities                           = false;
    CKEDITOR.config.protectedSource.push( /<\?[\s\S]*?\?>/g ); // protect php code
    //CKEDITOR.config.disableNativeSpellChecker = false;
    if($('documentSaved') === null || !$('documentSaved').hasClass('saved'))
      CKEDITOR.config.toolbarStartupExpanded = false;


    CKEDITOR.config.toolbar = [
      { name: 'document', items : ['Save','-','Maximize','-','Source'] },
      { name: 'tools', items : ['ShowBlocks'] },
      { name: 'clipboard', items : [ 'Undo','Redo','-','Cut','Copy','Paste','PasteText','PasteFromWord'] },
      { name: 'editing', items : [ 'Find','Replace','-','SelectAll'] }, //,'-','SpellChecker', 'Scayt' ] },
      '/',
      { name: 'colors', items : [ 'TextColor','BGColor' ] },
      { name: 'basicstyles', items : [ 'Bold','Italic','Underline','Strike','Subscript','Superscript','-','RemoveFormat' ] },
      { name: 'align', items : [ 'JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock'] }, //,'-','BidiLtr','BidiRtl' ] },
      { name: 'paragraph', items : [ 'Outdent','Indent','-','NumberedList','BulletedList','-','Blockquote','CreateDiv'] },
      '/',
      { name: 'styles', items : [ 'Styles','Format','FontSize' ] }, //'Font'
      { name: 'links', items : [ 'Link','Unlink','Anchor' ] },
      { name: 'insert', items : [ 'Image','Flash','Iframe','-','Table','HorizontalRule','SpecialChar'] },
      { name: 'feindura', items : [ 'Snippets'] },
      { name: 'tools', items : [ 'About' ] }
    ];

    // -> CREATES the editor instance, with replacing the textarea with the id="HTMLEditor"
    HTMLEditor = CKEDITOR.replace('HTMLEditor');

    // ADD FEINDURA CLASS back to the <html> element, ON MAXIMIZE
    // also FIXES the height of the editor content
    HTMLEditor.on('afterCommandExec',function(e){
      if(e.data.name === 'maximize' && e.data.command.state == CKEDITOR.TRISTATE_ON) {
        $$('html').addClass('feindura');
        $$('html, body').setStyles({
          'position': 'static',
          'width': '100%',
          'overflow':null
        });

        // fix editor size
        $('cke_contents_HTMLEditor').setStyle('height',$('cke_contents_HTMLEditor').getStyle('height').replace('px','') - 30);
        $$('.cke_maximized').setStyle('width',window.getSize().x - 20);

        // also hide some divs
        $$('header.main, footer.main, div.pageHeader, #leftSidebar, #rightSidebar, div.content, a.fastUp').setStyle('display','none');

      } else if(e.data.name === 'maximize' ) {

        // let them reapear again
        $$('header.main, footer.main, div.pageHeader, #leftSidebar, #rightSidebar, div.content, a.fastUp').setStyle('display',null);
      }
    });

    // -> add TOOLTIPS to ckeditor
    HTMLEditor.on('instanceReady',function() {
      $$('.cke_button').each(function(button) {
        var link = button.getChildren('a');
        if(link !== null) {
          // store tip text
          link.store('tip:text', link.get('title'));
          toolTipsBottom.attach(link);
          link.removeProperty('title');
        }
      });
    });


    // -> adds the EDITOR SLIDE IN/OUT tweens
    if($('documentSaved') !== null && $('documentSaved').hasClass('saved'))
      editorIsClicked = true;

      HTMLEditor.on('instanceReady',function() {
        var windowScroll = new Fx.Scroll(window.document,{duration:'normal'});
        var ckeditorContent = $('cke_contents_HTMLEditor');
        ckeditorContent.set('tween',{duration:400, transition: Fx.Transitions.Pow.easeIn});
        var ckeditorToolBar = $$("#cke_top_HTMLEditor .cke_toolbox")[0];
        // fixes the ckeditor to use slide ins
        $$('.cke_top').setStyles({
          // 'position':'relative',
          'padding':'6px 0'
        });
        $$('.cke_toolbox_collapser').setStyles({
          'position':'absolute',
          'right': 25,
          'top': 10
        });

        // var editorTweenTimeout;

        $$('div.editor #cke_HTMLEditor').addEvent('click',function(e){
          // clearTimeout(editorTweenTimeout);

          if(!editorHasFocus && !editorSubmited && ckeditorContent.getHeight() <= (editorStartHeight+20))
            HTMLEditor.resize(798,editorToHeight + 100);

          if(!editorHasFocus && typeOf(ckeditorToolBar) !== 'null' && ckeditorToolBar.getStyle('display') === 'none') {
            editorHasFocus = true;
            HTMLEditor.execCommand('toolbarCollapse'); //toggles
            // slide in
            ckeditorToolBar.set('slide',{duration:400, transition: Fx.Transitions.Pow.easeOut});
            ckeditorToolBar.slide('hide').slide('in');
          }

          // scroll to editor
          if(typeOf($$('div.editor')[0]) !== 'null')
            windowScroll.toElement($$('div.editor')[0]);

          editorHasFocus = true;
        });
        // $$('div.editor #cke_HTMLEditor').addEvent('mouseenter',function(e){
        //   if(!editorIsClicked && !editorSubmited && !editorHasFocus && ckeditorContent.getHeight() <= (editorStartHeight+20))
        //     editorTweenTimeout = (function(){ckeditorContent.tween('height',editorToHeight);}).delay(1000);
        // });
        // $$('div.editor #cke_HTMLEditor').addEvent('mouseleave',function(e){
        //   clearTimeout(editorTweenTimeout);
        //   if(!editorIsClicked && !editorSubmited && !editorHasFocus && ckeditorContent.getHeight() <= (editorToHeight+5) && ckeditorContent.getHeight() >= (editorToHeight-5))
        //     ckeditorContent.tween('height',editorStartHeight);
        //     //editorIsClicked = false;
        // });

        HTMLEditor.on('focus',function() {
          // clearTimeout(editorTweenTimeout);

          if(!editorHasFocus && !editorSubmited && ckeditorContent.getHeight() <= (editorStartHeight+20)) {
            HTMLEditor.resize(798,editorToHeight + 100);
          }

          // show toolbar directly
          if(!editorHasFocus && typeOf(ckeditorToolBar) !== 'null' && ckeditorToolBar.getStyle('display') == 'none') {
            HTMLEditor.execCommand('toolbarCollapse'); //toggles
            // slide in
            ckeditorToolBar.set('slide',{duration:400, transition: Fx.Transitions.Pow.easeOut});
            ckeditorToolBar.slide('hide').slide('in');
          }

          // scroll to editor
          if(typeOf($$('div.editor')[0]) !== 'null')
            windowScroll.toElement($$('div.editor')[0]);

          editorHasFocus = true;
        });

        $('HTMLEditorSubmit').addEvent('mousedown',function(e) {
          editorSubmited = true;
        });
      });
    }
  // ->> make PAGE TITLE EDITABLE

  // -> SAVE TITLE
  function saveTitle(title,type) {
    if(titleContent != title.get('html')) {

      // var
      var jsLoadingCircle = new Element('div',{'class': 'smallLoadingCircle'});
      var removeLoadingCircle = function(){};

      // url encodes the string
      title.getChildren('#rteMozFix').destroy();
      var content = encodeURIComponent(title.get('html')).replace( /\%20/g, '+' ).replace( /!/g, '%21' ).replace( /'/g, '%27' ).replace( /\(/g, '%28' ).replace( /\)/g, '%29' ).replace( /\*/g, '%2A' ).replace( /\~/g, '%7E' );
      //request(title,,,{title: feindura_langFile.ERRORWINDOW_TITLE,text: feindura_langFile.ERROR_SAVE},'post',true);

      // save the title
      new Request({
        url: feindura_basePath + 'library/controllers/frontendEditing.controller.php',
        method: 'post',
        data: 'save=true&type='+type+'&language='+title.retrieve('language')+'&category='+title.retrieve('category')+'&page='+title.retrieve('page')+'&data='+content,

        onRequest: function() {

          // -> ADD the LOADING CIRCLE
          if(!title.contains(jsLoadingCircle))
            title.grab(jsLoadingCircle,'top');
          removeLoadingCircle = feindura_loadingCircle(jsLoadingCircle, 8, 15, 12, 2, "#000");
        },
        onSuccess: function(html) {

        // -> fade out the loadingCircle
        jsLoadingCircle.set('tween',{duration: 200});
        jsLoadingCircle.fade('out');
        jsLoadingCircle.get('tween').chain(function(){
        // -> REMOVE the LOADING CIRCLE
        removeLoadingCircle();
        jsLoadingCircle.dispose();

        if(html.contains('####SAVING-ERROR####'))
          document.body.grab(feindura_showError(feindura_langFile.ERRORWINDOW_TITLE,feindura_langFile.ERROR_SAVE),'top');
        else {
          // -> UPDATE the TITLE everywhere
          title.set('html', html+"<p id='rteMozFix' style='display:none'><br></p>");
          $('edit_title').set('value',html);
          $$('#leftSidebar menu.vertical a.active').getLast().getChildren('span').set('html',html);
          setSidbarMenuTextLength();
          titleContent = $('editablePageTitle').get('html');
          // display document saved
          showDocumentSaved();
        }
          });
        },
        //-----------------------------------------------------------------------------
        //Our request will most likely succeed, but just in case, we'll add an
        //onFailure method which will let the user know what happened.
        onFailure: function() { //-----------------------------------------------------

          // -> fade out the loadingCircle
          if(!title.contains(jsLoadingCircle))
            title.grab(jsLoadingCircle,'top');
            jsLoadingCircle.set('tween',{duration: 200});
            jsLoadingCircle.fade('out');
            jsLoadingCircle.get('tween').chain(function(){
            // -> REMOVE the LOADING CIRCLE
            removeLoadingCircle();
            jsLoadingCircle.dispose();
            // add errorWindow
            document.body.grab(feindura_showError(feindura_langFile.ERRORWINDOW_TITLE,feindura_langFile.ERROR_SAVE),'top');
          });

        }
      }).send();

      titleSaved = true;
    }
  }

  if($('editablePageTitle') !== null) {

    // vars
    var titleSaved = false;
    var titleContent = '';

    $('editablePageTitle').moorte({location:'none'});

    // ->> GO TROUGH ALL EDITABLE BLOCK

    // STORE page IDS in the elements storage
    feindura_setPageIds($('editablePageTitle'));

    // save on enter
    $('editablePageTitle').addEvent('keydown', function(e) {
      if(e.key == 'enter' && (typeOf(MooRTE.Elements.linkPop) == 'null' || (MooRTE.Elements.linkPop && MooRTE.Elements.linkPop.visible === false))) {
          e.stop();
          saveTitle(this,'title');
      }
    });
    // save on blur
    $('editablePageTitle').addEvent('blur', function(e) {
      if((typeOf(MooRTE.Elements.linkPop) == 'null' || (MooRTE.Elements.linkPop && MooRTE.Elements.linkPop.visible === false))) {
          saveTitle(this,'title');
      }
    });
    // on focus
    $('editablePageTitle').addEvent('focus', function() {
      titleContent = $('editablePageTitle').get('html');
      if(titleSaved)
        titleSaved = false;
    });
  }

  // CHANGE CATEGORY
  if($('categorySelection') !== null) {
    $('categorySelection').addEvent('change',function() {
      window.location.href = '?category=' + this[this.selectedIndex].value + '&page=new';
    });
  }

  // CHANGE TEMPLATE
  if($('templateSelection') !== null) {
    $('templateSelection').addEvent('change',function() {
      newLocation = (window.location.href.indexOf('&template') != -1) ? window.location.href.substr(0,window.location.href.indexOf('&template')) : window.location.href;
      if(this[this.selectedIndex].value == '-')
        window.location.href = newLocation;
      else
        window.location.href = newLocation + '&template=' + this[this.selectedIndex].value;
    });
  }

  // -----------------------------------------
  // ADD SLIDE TO THE VISIT TIME MAX
  if($('visitTimeMax') !== null) {

    // creates the slide effect
    var slideVisitTimeMax = new Fx.Slide($('visitTimeMaxContainer'),{duration: 300, transition: Fx.Transitions.Pow.easeOut});
    // slides the hotky div in, on start
    slideVisitTimeMax.hide();
    // sets the SLIDE OUT on MOUSE ENTER
    $('visitTimeMax').addEvent('mouseenter', function(e){
      e.stop();
      slideVisitTimeMax.slideIn();
    });
    // sets the SLIDE IN on MOUSE LEAVE
    $('visitTimeMax').addEvent('mouseleave', function(e){
      e.stop();
      //slideVisitTimeMax.slideOut();
    });
    // sets the SLIDE OUT on MOUSE ENTER
    $('visitTimeMaxContainer').addEvent('mouseenter', function(e){
      e.stop();
      slideVisitTimeMax.slideIn();
    });
    // sets the SLIDE IN on MOUSE LEAVE
    $('visitTimeMaxContainer').addEvent('mouseleave', function(e){
      e.stop();
      slideVisitTimeMax.slideOut();
    });
  }

  // -----------------------------------------
  // ADD SLIDE TO THE VISIT TIME MIN
  if($('visitTimeMin') !== null) {

    // creates the slide effect
    var slideVisitTimeMin = new Fx.Slide($('visitTimeMinContainer'),{duration: '300', transition: Fx.Transitions.Pow.easeOut});
    // slides the hotky div in, on start
    slideVisitTimeMin.hide();
    // sets the SLIDE OUT on MOUSE ENTER
    $('visitTimeMin').addEvent('mouseenter', function(e){
      e.stop();
      slideVisitTimeMin.slideIn();
    });
    // sets the SLIDE IN on MOUSE LEAVE
    $('visitTimeMin').addEvent('mouseleave', function(e){
      e.stop();
      //slideVisitTimeMin.slideOut();
    });
    // sets the SLIDE OUT on MOUSE ENTER
    $('visitTimeMinContainer').addEvent('mouseenter', function(e){
      e.stop();
      slideVisitTimeMin.slideIn();
    });
    // sets the SLIDE IN on MOUSE LEAVE
    $('visitTimeMinContainer').addEvent('mouseleave', function(e){
      e.stop();
      slideVisitTimeMin.slideOut();
    });
  }

  // -----------------------------------------
  // ADD SLIDE TO THE HOTKEYs (Tastenkürzel)
  if($('hotKeys') !== null) {

    // creates the slide effect
    var slideHotkeys = new Fx.Slide($('hotKeys'),{duration: '750', transition: Fx.Transitions.Pow.easeOut});

    // slides the hotky div in, on start
    slideHotkeys.hide();

    // sets the SLIDE EFFECT to the buttons
    if($('hotKeysToogle') !== null) {
       $('hotKeysToogle').addEvent('click', function(e){
      e.stop();
      slideHotkeys.toggle();
    });
   }
  }

  // -----------------------------------------
  // LEAVING WITHOUT SAVING CHECKS
  // ->> CHECKS if changes in the editor page was made and add a *

  // CHECK if fields are changed
  $$('#editorForm input, #editorForm textarea').each(function(formfields){
    formfields.addEvent('change',function() {
      pageContentChangedSign();
    });
  });
  // CHECK if the HTMLeditor content was changed
  if($('HTMLEditor') !== null) {
    HTMLEditor.on('blur',function() {
      if(HTMLEditor.checkDirty()) {
        pageContentChangedSign();
      }
    });
    // on typing
    HTMLEditor.on("instanceReady", function() {
        this.document.on("keyup", function(){
          pageContentChangedSign();
        });
        this.document.on("paste", function(){
          pageContentChangedSign();
        });
      }
    );
    // on mode changeing
    HTMLEditor.on('mode', function(e) {
      if(e.editor.mode === 'source' && HTMLEditor.checkDirty()) {
        pageContentChangedSign();
      }
      }
    );
    LeavingWithoutSavingWarning();
  }
});