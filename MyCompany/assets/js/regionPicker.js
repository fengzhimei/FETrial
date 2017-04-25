(function ($) {
  $.regionPicker = function (instanceName, options) {
    if ($.regionPicker.instances[instanceName]) {
      return $.regionPicker.instances[instanceName];
    }
    return new $.regionPicker._internal(instanceName, options).init();
  };

  $.regionPicker.instances = {};
  $.regionPicker.defaults = {
      initialSelection: [],
      handleDistricts: false,
      maxSelection: 1,
      modalTitle: '选择工作地点',
      allRegionsTabTitle: '全部',
      hotCitiesTitle: '热门城市',
      allProvincesTitle: '全部省份',
      regionsData: {},
      btnOkText: '确认',
      btnCancelText: '取消',
      callbackFunc: null
  };

  $.regionPicker._internal = function(instanceName, options) {
    this.options = $.extend({}, $.regionPicker.defaults, options);
    this.instanceName = instanceName;
  }

  $.regionPicker._internal.prototype = {
    init: function () {
      var self = this;
      var pickerHtmlTemp = 
          '<div class="regionPickerModal modal fade" id="'+ self.instanceName +'" tabindex="-1" role="dialog" aria-labelledby="'+ self.instanceName +'_label">' +
              '<div class="modal-dialog" role="document">' +
                '<div class="modal-content">' +
                  '<div class="modal-header">' +
                    '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                    '<h4 class="modal-title" id="'+ self.instanceName +'_label">'+ self.options.modalTitle +'</h4>' +
                  '</div>' +
                  '<div class="modal-body">' +
                    '<div class="regionPickerResult">' +
                    '</div>' +
                    '<ul class="nav nav-tabs regionPickerTabs custom-bs-tab-hh" role="tablist">' +
                      '<li role="presentation" class="active">' +
                        '<a href="javascript:;" data-target="#'+ self.instanceName +'_allregionstab" aria-controls="'+ self.instanceName +'_allregionstab" role="tab" data-toggle="tab">'+ self.options.allRegionsTabTitle +' <i class="glyphicon glyphicon-menu-down"></i></a>' +
                      '</li>' +
                    '</ul>' +
                    '<div class="tab-content regionPickerTabContent">' +
                      '<div role="tabpanel" class="tab-pane active" id="'+ self.instanceName +'_allregionstab">' +
                        '<p class="region-title">'+ self.options.hotCitiesTitle +'</p>' +                              
                        '<div class="region-list">' +                                
                          '<ul>' +
                            '{{#each categories.hotcities}}' +
                            '<li>' +
                              '<a href="javascript:;" class="region-item" data-code="{{@this}}" data-name="{{lookup ../regions @this}}">{{lookup ../regions @this}}<i class="checkmark"><b>&#10003;</b></i></a>' +
                            '</li>' +
                            '{{/each}}' +
                          '</ul>' +                              
                        '</div>' +                              
                        '<p class="region-title">'+ self.options.allProvincesTitle +'</p>' +                              
                        '<div class="region-list">' +                                
                          '<ul>' +
                            '{{#each categories.provinces}}' +
                            '<li>' +
                              '<a href="javascript:;" class="region-item" data-code="{{@this}}" data-name="{{lookup ../regions @this}}">{{lookup ../regions @this}}<i class="checkmark"><b>&#10003;</b></i></a>' +
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
      var pickerHtml = compiledPickerHtmlTemp(self.options.regionsData);

      $('body').append(pickerHtml);

      self._bindEvents();

      $.regionPicker.instances[self.instanceName] = self;

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
          self._selectCity('<span data-code="' + value[0] + '" data-name="' + value[1] + '">' + value[1] + ' <span>×</span></span>');
        });
        $('#' + self.instanceName + ' ul.regionPickerTabs>li:first').trigger('click');
        $('#' + self.instanceName + ' ul.regionPickerTabs>li:last a').tab('show');
      });

      $('#' + self.instanceName + ' ul.regionPickerTabs>li:first').off('click').on('click', function(event){
        self._switchPickerTab(event.delegateTarget);
      });

      $('#' + self.instanceName + ' #'+ self.instanceName +'_allregionstab a.region-item').off('click').on('click', function(event){
        self._selectRegion(event.delegateTarget);
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
    _selectRegion: function(elRegion){
      var self = this;
      var regionCode = $.trim($(elRegion).data('code'));
      var regionName = $.trim($(elRegion).data('name'));
      var isRegionHasDistrict = ($.inArray(regionCode, self.options.regionsData.categories.district) > -1);
      var isProvince = ($.inArray(regionCode, self.options.regionsData.categories.provinces) > -1)
      if (isProvince || (isRegionHasDistrict && self.options.handleDistricts)) { //选择了省份或者有区且允许选择区，进入二级
        self._getSubRegion(regionCode, regionName);
      } else { //直接选择
        self._selectCity(elRegion);
      }
    },
    _getSubRegion: function(regionCode, regionName) {
      var self = this;
      var tabContentHtmlTemp = 
          '<div role="tabpanel" class="tab-pane" id="'+ self.instanceName +'_subregionstab_'+ regionCode +'">' +
            '<div class="region-list">' +
              '<ul>' +
                '<li>' +
                  '<a href="javascript:;" class="region-item regions-allin" data-code="'+ regionCode +'" data-name="'+ regionName +'">'+ regionName +'<i class="checkmark"><b>&#10003;</b></i></a>' +
                '</li>' +
              '</ul>' +
              '<ul>' +
                '{{#each relations.['+ regionCode +']}}' +
                '<li>' +
                  '<a href="javascript:;" class="region-item" data-code="{{@this}}" data-name="{{lookup ../regions @this}}">{{lookup ../regions @this}}<i class="checkmark"><b>&#10003;</b></i></a>' +
                '</li>' +
                '{{/each}}' +
              '</ul>' +                              
            '</div>' +
          '</div>';
      var tabHtml = 
          '<li role="presentation">' +
            '<a href="javascript:;" data-target="#'+ self.instanceName +'_subregionstab_'+ regionCode +'" aria-controls="'+ self.instanceName +'_subregionstab_'+ regionCode +'" role="tab" data-toggle="tab">'+ regionName +' <i class="glyphicon glyphicon-menu-down"></i>' +
            '</a>' +
          '</li>';

      var compiledTabContentHtmlTemp = Handlebars.compile(tabContentHtmlTemp);
      var tabContentHtml = compiledTabContentHtmlTemp(self.options.regionsData);

      $(tabHtml).appendTo($('#' + self.instanceName + ' ul.regionPickerTabs')).off('click').on('click', function(event){
        self._switchPickerTab(event.delegateTarget);
      });
      $(tabContentHtml).appendTo($('#' + self.instanceName + ' div.regionPickerTabContent'));

      $('#' + self.instanceName + ' #'+ self.instanceName +'_subregionstab_'+ regionCode +' .regions-allin').off('click').on('click', function(event){
        self._selectCity(event.delegateTarget);
      });

      $('#' + self.instanceName + ' #'+ self.instanceName +'_subregionstab_'+ regionCode +' .region-item').not('.regions-allin').off('click').on('click', function(event){
        self._selectRegion(event.delegateTarget);
      });

      self._refreshSelectionState();

      $('#' + self.instanceName + ' ul.regionPickerTabs>li:last a').tab('show');
    },
    _selectCity: function(elRegion) {
      var self = this;
      var regionCode = $.trim($(elRegion).data('code'));
      var regionName = $.trim($(elRegion).data('name'));

      var resultHtml = '<span data-code="' + regionCode + '" data-name="' + regionName + '">' + regionName + ' <span>×</span></span>';
      var currentSelection = $('#' + self.instanceName + ' div.regionPickerResult>span');
      var matchedElInExistingSelection = currentSelection.filter('[data-code="'+ regionCode +'"]');

      if (matchedElInExistingSelection.length > 0) 
        return false;

      if (self.options.maxSelection > 1) { //多选
        var toBeRemovedRegionCodes = [];
        if (!$(elRegion).hasClass('regions-allin')) {
          toBeRemovedRegionCodes = self._getParentCodes(regionCode);
        }
        else {
          toBeRemovedRegionCodes = self._getChildCodes(regionCode);
        }

        $.each(toBeRemovedRegionCodes, function(key, value){
          $('#' + self.instanceName + ' div.regionPickerResult>span[data-code="'+ value +'"]').remove();
        });

        var updatedSelection = $('#' + self.instanceName + ' div.regionPickerResult>span');
        if(updatedSelection.length >= self.options.maxSelection) {
          return false;
        }
      }
      else { //单选
        currentSelection.remove();
      }

      $(resultHtml).appendTo('#' + self.instanceName + ' div.regionPickerResult').off('click').on('click', function(event){
        $(event.delegateTarget).remove();
        self._refreshSelectionState();
      });

      self._refreshSelectionState();
    },
    _refreshSelectionState: function() {
      var self = this;
      $('#' + self.instanceName + ' div.region-list li>a').removeClass('selected semiselected');

      $('#' + self.instanceName + ' div.regionPickerResult>span').each(function(){
        var regionCode = $.trim($(this).data('code'));
        var parentRegionCodes = self._getParentCodes(regionCode);
        $.each(parentRegionCodes, function(key, value){
          $('#' + self.instanceName + ' div.region-list li>a[data-code="'+ value +'"]').addClass('semiselected');
        });
        $('#' + self.instanceName + ' div.region-list li>a[data-code="'+ regionCode +'"]').addClass('selected');
      });
    },
    _getParentCodes: function(regionCode) {
      var self = this;
      var resultArr = [];
      var keys = $.map(self.options.regionsData.relations, function(element,index) {
        if ($.inArray(regionCode, element) > -1) {
          //下面进行二次匹配,以确保选择了"区"能一直匹配到"省"
          //目前没有更好的查找算法，有待优化
          var subkeys = $.map(self.options.regionsData.relations, function(element,subindex) {
            if ($.inArray(index, element) > -1) {
              resultArr.push(subindex);
            }
          });
          resultArr.push(index);
          return resultArr;
        }
      });
      return keys;
    },
    _getChildCodes: function(regionCode) {
      var self = this;
      var resultArr = [];
      var regionArray = self.options.regionsData.relations[regionCode];
      if (typeof regionArray !== 'undefined') {
        $.merge(resultArr, regionArray);

        $.each(regionArray, function(key, value){
          var subRegionArray = self.options.regionsData.relations[value];
          if (typeof subRegionArray !== 'undefined') {
            $.merge(resultArr, subRegionArray);
          }
        });
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
      $('#' + self.instanceName + ' div.regionPickerResult>span').each(function(){
        var regionCode = $.trim($(this).data('code'));
        var regionName = $.trim($(this).data('name'));
        arrResults.push([regionCode,regionName]);
      });
      return arrResults;
    }
  };
})(jQuery);