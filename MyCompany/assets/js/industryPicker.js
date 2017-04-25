(function ($) {
  $.industryPicker = function (instanceName, options) {
    if ($.industryPicker.instances[instanceName]) {
      return $.industryPicker.instances[instanceName];
    }
    return new $.industryPicker._internal(instanceName, options).init();
  };

  $.industryPicker.instances = {};
  $.industryPicker.defaults = {
      initialSelection: [],
      maxSelection: 1,
      modalTitle: '选择行业分类',
      allIndustriesTabTitle: '全部',
      industriesData: {},
      btnOkText: '确认',
      btnCancelText: '取消',
      callbackFunc: null
  };

  $.industryPicker._internal = function(instanceName, options) {
    this.options = $.extend({}, $.industryPicker.defaults, options);
    this.instanceName = instanceName;
  }

  $.industryPicker._internal.prototype = {
    init: function () {
      var self = this;
      var pickerHtmlTemp = 
          '<div class="industryPickerModal modal fade" id="'+ self.instanceName +'" tabindex="-1" role="dialog" aria-labelledby="'+ self.instanceName +'_label">' +
              '<div class="modal-dialog" role="document">' +
                '<div class="modal-content">' +
                  '<div class="modal-header">' +
                    '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                    '<h4 class="modal-title" id="'+ self.instanceName +'_label">'+ self.options.modalTitle +'</h4>' +
                  '</div>' +
                  '<div class="modal-body">' +
                    '<div class="industryPickerResult">' +
                    '</div>' +
                    '<ul class="nav nav-tabs industryPickerTabs custom-bs-tab-hh" role="tablist">' +
                      '<li role="presentation" class="active">' +
                        '<a href="javascript:;" data-target="#'+ self.instanceName +'_allindustriestab" aria-controls="'+ self.instanceName +'_allindustriestab" role="tab" data-toggle="tab">'+ self.options.allIndustriesTabTitle +' <i class="glyphicon glyphicon-menu-down"></i></a>' +
                      '</li>' +
                    '</ul>' +
                    '<div class="tab-content industryPickerTabContent">' +
                      '<div role="tabpanel" class="tab-pane active" id="'+ self.instanceName +'_allindustriestab">' +                           
                        '<div class="industry-list">' +                                
                          '<ul>' +
                            '{{#each categories.rootIndustries}}' +
                            '<li>' +
                              '<a href="javascript:;" class="industry-item" data-code="{{@this}}" data-name="{{lookup ../industries @this}}">{{lookup ../industries @this}}<i class="checkmark"><b>&#10003;</b></i></a>' +
                            '</li>' +
                            '{{/each}}' +
                          '</ul>' +                              
                        '</div>' +
                      '</div>' +
                    '</div>' +
                  '</div>' +
                  '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-default" data-dismiss="modal">'+ self.options.btnCancelText +'</button>' +
                    '<button type="button" id="'+ self.instanceName +'_btnOk" class="btn btn-primary btn-primary-hh">'+ self.options.btnOkText +'</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
          '</div>';

      var compiledPickerHtmlTemp = Handlebars.compile(pickerHtmlTemp);
      var pickerHtml = compiledPickerHtmlTemp(self.options.industriesData);

      $('body').append(pickerHtml);

      self._bindEvents();

      $.industryPicker.instances[self.instanceName] = self;

      return self;
    },
    open: function() {
      var self = this;
      $('#' + self.instanceName).modal({
        backdrop: 'static',
        keyboard: false
      });
    },
    _bindEvents: function() {
      var self = this;

      $('#' + self.instanceName).on('hidden.bs.modal', function (e) {
        if ($('#' + self.instanceName + ' #' + self.instanceName + '_btnOk').is(':disabled') && $.isFunction(self.options.callbackFunc)) {
          self.options.callbackFunc.apply(self, self.getResults());
        }
      });

      $('#' + self.instanceName).on('show.bs.modal', function (e) {
        
        self._repositionModal(this);

        $('#' + self.instanceName + ' #' + self.instanceName + '_btnOk').prop('disabled', false);

        $.each(self.options.initialSelection, function(key, value){
          self._selectSingleIndustry('<span data-code="' + value[0] + '" data-name="' + value[1] + '">' + value[1] + ' <span>×</span></span>');
        });
        $('#' + self.instanceName + ' ul.industryPickerTabs>li:first').trigger('click');
        $('#' + self.instanceName + ' ul.industryPickerTabs>li:last a').tab('show');
      });

      $('#' + self.instanceName + ' ul.industryPickerTabs>li:first').off('click').on('click', function(event){
        self._switchPickerTab(event.delegateTarget);
      });
      
      $('#' + self.instanceName + ' #'+ self.instanceName +'_allindustriestab a.industry-item').off('click').on('click', function(event){
        self._selectIndustry(event.delegateTarget);
      });

      $('#' + self.instanceName + ' #' + self.instanceName + '_btnOk').off('click').on('click', function(event){
        $(this).prop('disabled', true);
        $('#' + self.instanceName).modal('hide');
      });
    },
    _switchPickerTab: function(elTab){
      var self = this;
      if ($(elTab).nextAll('li').length == 0) {
        return false;
      }

      $(elTab).nextAll('li').remove();

      var tabPanelId = $(elTab).children(":first").data('target');
      if (tabPanelId) {
        $('#' + self.instanceName + ' ' + tabPanelId).nextAll('div').remove();
      }
    },
    _selectIndustry: function(elIndustry){
      var self = this;
      var industryCode = $.trim($(elIndustry).data('code'));
      var industryName = $.trim($(elIndustry).data('name'));
      var subIndustryArray = self.options.industriesData.relations[industryCode];
      if (typeof subIndustryArray !== 'undefined') {
        self._getSubIndustry(industryCode, industryName);
      } else { //直接选择
        self._selectSingleIndustry(elIndustry);
      }
    },
    _getSubIndustry: function(industryCode, industryName) {
      var self = this;
      var tabContentHtmlTemp = 
          '<div role="tabpanel" class="tab-pane" id="'+ self.instanceName +'_subindustriestab_'+ industryCode +'">' +
            '<div class="industry-list">' +
              '<ul>' +
                '<li>' +
                  '<a href="javascript:;" class="industry-item industries-allin" data-code="'+ industryCode +'" data-name="'+ industryName +'">'+ industryName +'<i class="checkmark"><b>&#10003;</b></i></a>' +
                '</li>' +
              '</ul>' +
              '<ul>' +
                '{{#each relations.['+ industryCode +']}}' +
                '<li>' +
                  '<a href="javascript:;" class="industry-item" data-code="{{@this}}" data-name="{{lookup ../industries @this}}">{{lookup ../industries @this}}<i class="checkmark"><b>&#10003;</b></i></a>' +
                '</li>' +
                '{{/each}}' +
              '</ul>' +                              
            '</div>' +
          '</div>';
      var tabHtml = 
          '<li role="presentation">' +
            '<a href="javascript:;" data-target="#'+ self.instanceName +'_subindustriestab_'+ industryCode +'" aria-controls="'+ self.instanceName +'_subindustriestab_'+ industryCode +'" role="tab" data-toggle="tab">'+ industryName +' <i class="glyphicon glyphicon-menu-down"></i>' +
            '</a>' +
          '</li>';

      var compiledTabContentHtmlTemp = Handlebars.compile(tabContentHtmlTemp);
      var tabContentHtml = compiledTabContentHtmlTemp(self.options.industriesData);

      $(tabHtml).appendTo($('#' + self.instanceName + ' ul.industryPickerTabs')).off('click').on('click', function(event){
        self._switchPickerTab(event.delegateTarget);
      });
      $(tabContentHtml).appendTo($('#' + self.instanceName + ' div.industryPickerTabContent'));

      $('#' + self.instanceName + ' #'+ self.instanceName +'_subindustriestab_'+ industryCode +' .industry-item').off('click').on('click', function(event){
        self._selectSingleIndustry(event.delegateTarget);
      });

      self._refreshSelectionState();

      $('#' + self.instanceName + ' ul.industryPickerTabs>li:last a').tab('show');
    },
    _selectSingleIndustry: function(elIndustry) {
      var self = this;
      var industryCode = $.trim($(elIndustry).data('code'));
      var industryName = $.trim($(elIndustry).data('name'));

      var resultHtml = '<span data-code="' + industryCode + '" data-name="' + industryName + '">' + industryName + ' <span>×</span></span>';
      var currentSelection = $('#' + self.instanceName + ' div.industryPickerResult>span');
      var matchedElInExistingSelection = currentSelection.filter('[data-code="'+ industryCode +'"]');

      if (matchedElInExistingSelection.length > 0) 
        return false;

      if (self.options.maxSelection > 1) { //多选
        var toBeRemovedIndustryCodes = [];
        if (!$(elIndustry).hasClass('industries-allin')) {
          toBeRemovedIndustryCodes = self._getParentCodes(industryCode);
        }
        else {
          toBeRemovedIndustryCodes = self._getChildCodes(industryCode);
        }

        $.each(toBeRemovedIndustryCodes, function(key, value){
          $('#' + self.instanceName + ' div.industryPickerResult>span[data-code="'+ value +'"]').remove();
        });

        var updatedSelection = $('#' + self.instanceName + ' div.industryPickerResult>span');
        if(updatedSelection.length >= self.options.maxSelection) {
          return false;
        }
      }
      else { //单选
        currentSelection.remove();
      }

      $(resultHtml).appendTo('#' + self.instanceName + ' div.industryPickerResult').off('click').on('click', function(event){
        $(event.delegateTarget).remove();
        self._refreshSelectionState();
      });

      self._refreshSelectionState();
    },
    _refreshSelectionState: function() {
      var self = this;
      $('#' + self.instanceName + ' div.industry-list li>a').removeClass('selected semiselected');

      $('#' + self.instanceName + ' div.industryPickerResult>span').each(function(){
        var industryCode = $.trim($(this).data('code'));
        var parentIndustryCodes = self._getParentCodes(industryCode);
        $.each(parentIndustryCodes, function(key, value){
          $('#' + self.instanceName + ' div.industry-list li>a[data-code="'+ value +'"]').addClass('semiselected');
        });
        $('#' + self.instanceName + ' div.industry-list li>a[data-code="'+ industryCode +'"]').addClass('selected');
      });
    },
    _getParentCodes: function(industryCode) {
      var self = this;
      var resultArr = [];
      var keys = $.map(self.options.industriesData.relations, function(element,index) {
        if ($.inArray(industryCode, element) > -1) {
          resultArr.push(index);
          return resultArr;
        }
      });
      return keys;
    },
    _getChildCodes: function(industryCode) {
      var self = this;
      var resultArr = [];
      var industryArray = self.options.industriesData.relations[industryCode];
      if (typeof industryArray !== 'undefined') {
        $.merge(resultArr, industryArray);
      }
      
      return resultArr;
    },
    _repositionModal: function(modalEl) {
      var $clone = $(modalEl).clone().css('display', 'block').appendTo('body');
      var top = Math.round(($clone.height() - $clone.find('.modal-content').height()) / 2);
      top = top > 0 ? top : 0;
      $clone.remove();
      $(modalEl).find('.modal-content').css("margin-top", top);
    },
    getResults: function() {
      var self = this;
      var arrResults = [];
      $('#' + self.instanceName + ' div.industryPickerResult>span').each(function(){
        var industryCode = $.trim($(this).data('code'));
        var industryName = $.trim($(this).data('name'));
        arrResults.push([industryCode,industryName]);
      });
      return arrResults;
    }
  };
})(jQuery);