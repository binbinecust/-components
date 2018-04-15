import app from 'App';

import { KeyCode } from './util.js';
import './index.scss';

class SelectMultipleController {
  constructor($scope, $element, $attrs, $timeout) {
    this.services = { $scope, $element, $timeout };
    this.element = $element[0];
    this.inputRef = this.element.querySelector('input');
    this.mirrorNode = this.element.querySelector('.select-search__field__mirror');

    // 这里主要是处理中文输入的情况，根据输入框内容改变输入框宽度
    this.inputRef.addEventListener('input', (evt) => {
      this.labelText = evt.target.value;
      this.setInputWidth();
      $scope.$apply();
    }, false);

    this.removeOptionsWatch = $scope.$parent.$watchCollection($attrs.options, options => {
      this.options = options || [];
      this.typeOptions = this.options;
    });
  }

  $onInit() {
    this.checkRequired = false;
    this.editing = false;
    this.activeIndex = -1;
    this.selectedOptions = [];
    this.typeOptions = this.options;
    this.uiViewElement = document.querySelector('ui-view');

    this.ngModel.$render = () => {
      this.selectedOptions = this.ngModel.$viewValue || [];
    };
  }

  $onDestroy() {
    this.uiViewElement.removeEventListener('scroll', this.scrollHandler);
    this.removeOptionsWatch();
  }

  onInputKeyDown(evt) {
    if (this.disabled) return;

    const { typeOptions, selectedOptions } = this;

    const { keyCode } = evt;
    if (!evt.target.value && keyCode === KeyCode.BACKSPACE) {
      evt.preventDefault();
      if (selectedOptions.length) {
        this.activeIndex = 0;
        this.removeSelected(this.getLabel(selectedOptions[selectedOptions.length - 1]));
      }
      return;
    }
    if (keyCode === KeyCode.ENTER && typeOptions.length) {
      evt.preventDefault();
      this.changeSelectedCur(this.typeOptions[this.activeIndex]);
    }
    if (keyCode === KeyCode.DOWN) {
      if (!typeOptions.length) return;
      evt.preventDefault();
      this.changeSelectedNext();
    } else if (keyCode === KeyCode.UP) {
      if (!typeOptions.length) return;
      evt.preventDefault();
      this.changeSelectedPre();
      return;
    } else if (keyCode === KeyCode.ESC) {
      evt.preventDefault();
      this.onOuterBlur();
      this.inputRef.blur();
      return;
    }
  }

  changeSelectedPre() {
    this.activeIndex--;
    if (this.activeIndex < 0) this.activeIndex = this.typeOptions.length - 1;
  }

  changeSelectedNext() {
    this.activeIndex++;
    if (this.activeIndex > this.typeOptions.length - 1) this.activeIndex = 0;
  }

  changeSelectedCur(selectedItem) {
    if (this.activeIndex < 0) {
      this.activeIndex = 0;
      return;
    }

    if (this.selectedOptions.includes(selectedItem)) {
      this.selectedOptions = this.selectedOptions.filter(item => item !== selectedItem);
    } else {
      this.selectedOptions = this.selectedOptions.concat(selectedItem);
    }
    this.setView();
    this.asyncScrollIntoView();
    if (this.searchText) {
      this.activeIndex = 0;
      this.addSelectFocused();
    }
  }

  onClickOption(selectedItem, evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.changeSelectedCur(selectedItem);
  }

  onInputChange() {
    this.activeIndex = 0;
    if (!this.editing) this.editing = true;

    if (this.remote) {
      this.remoteMethod({ value: this.searchText });
    } else {
      const resolveText = this.searchText.toUpperCase();
      this.typeOptions = this.options
        .filter(item => this.getLabel(item).toUpperCase().includes(resolveText))
        .sort((a, b) => {
          return this.getLabel(a).toUpperCase().indexOf(resolveText) -
            this.getLabel(b).toUpperCase().indexOf(resolveText);
        });
      if (this.customizable && this.typeOptions.length === 0 && this.searchText) {
        this.typeOptions = [this.searchText];
      }
    }
  }

  stopPropagation(evt) {
    this.editing = true;
    evt.stopPropagation();
  }

  removeChoice(evt, item) {
    if (this.disabled) return;

    evt.stopPropagation();
    evt.preventDefault();
    this.activeIndex = 0;
    if (!this.editing) this.inputRef.focus();
    this.addSelectFocused();
    this.removeSelected(this.getLabel(item));
  }

  onMenuDeselect(evt) {
    if (this.disabled) return;

    evt.preventDefault();
    this.inputRef.focus();
    this.addSelectFocused();
    this.resolveFixed();
    const sLength = this.selectedOptions.length;
    if (sLength) {
      const lastOne = this.selectedOptions[sLength - 1];
      this.activeIndex = this.options.findIndex(item => item === lastOne);
    } else {
      this.activeIndex = -1;
    }
  }

  resolveFixed() {
    if (this.fixed) {
      const { $scope } = this.services;
      const selectBoxInfo = this.element.getBoundingClientRect();
      this.fixedListStyle = {
        position: 'fixed',
        top: `${selectBoxInfo.bottom}px`,
        left: `${selectBoxInfo.left}px`,
        minWidth: `${selectBoxInfo.width}px`,
        zIndex: 999999,
      };
      if (!this.scrollHandler) {
        this.scrollHandler = () => {
          this.editing = false;
          $scope.$apply();
          this.scrollHandler = null;
        };
        this.uiViewElement.addEventListener(
          'scroll',this.scrollHandler, { once: true, passive: true }
        );
      }
    } else {
      this.fixedListStyle = undefined;
    }
  }

  removeSelected(selectedLabel) {
    this.selectedOptions =
        this.selectedOptions.filter(v => this.getLabel(v) !== selectedLabel);
    this.setView();
  }

  getLabel($item) {
    const result = this.label({ $item });
    return String(result === undefined ? $item : result);
  }

  onOuterBlur() {
    this.editing = false;
    this.searchText = '';
    this.labelText = '';
    this.setInputWidth();

    if (this.required && !this.checkRequired) {
      this.checkRequired = true;
    }
  }

  addSelectFocused() {
    this.searchText = '';
    this.labelText = '';
    this.setInputWidth();
    this.typeOptions = this.options;
    this.editing = true;
  }

  onMouserEnter(index) {
    this.activeIndex = index;
  }

  setView() {
    this.ngModel.$setViewValue(this.selectedOptions);
    this.ngModel.$render();
  }

  wrapTrackBy(item) {
    const result = this.trackBy({ $item: item });
    return result === undefined ? this.getLabel(item) : result;
  }

  setInputWidth() {
    const { $timeout } = this.services;
    $timeout(() => this.inputRef.style.width = `${this.mirrorNode.clientWidth}px`);
  }

  asyncScrollIntoView() {
    const { $timeout } = this.services;
    $timeout(() => this.inputRef.scrollIntoView());
  }

  getStateClass(item, index) {
    const isIncludes = this.selectedOptions.includes(item);
    if (this.activeIndex === index && isIncludes) {
      return 'select-selection-item-active__selected';
    } else if (this.activeIndex === index && !isIncludes) {
      return 'select-selection-item-active';
    } else if (this.activeIndex !== index && isIncludes) {
      return 'select-selection-item-selected';
    }
  }
}

SelectMultipleController.$inject = ['$scope', '$element', '$attrs', '$timeout'];

app.component('selectMultiple', {
  require: {
    ngModel: '^ngModel'
  },
  controller: SelectMultipleController,
  template: require('./index.html'),
  bindings: {
    placeholder: '@',      // 输入框占位，String
    label: '&',            // key, $item.key, 用于展示
    required: '<',         // 是否必选，Boolean，默认false
    disabled: '<',         // 是否不可选，Boolean，默认false
    customizable: '<',     // 用户是否可以自定义内容，Boolean，默认false
    isLoading: '<',        // 加载效果，Boolean，默认false
    remote: '<',           // 是否远程搜索，Boolean，默认false
    fixed: '<',            // 是否fixed定位， Boolean，默认false
    remoteMethod: '&',     // 远程搜索方法，Function
    trackBy: '&',          // 用于 track by 的值，默认使用label
  },
});


/*
> 实例:
  html
  <select-multiple
    x-label="$item.key"
    x-required="true"
    x-customizable="true"
    x-options="$ctrl.testArr"
    x-track-by="$item.key"
    ng-model="$ctrl.test"
  ></select-multiple>
  js
  $timeout(() => {
    this.testArr =
        [{key: 'sdfgs'}, {key: 'bdsb'}, {key: 'twert'}, {key: 'sdgfsdf'}, {key: 'fsffs'}];
  }, 1000);
  $timeout(() => {
    this.test = [this.testArr[1]];
  }, 3000);

  关于自定义:
  自定义是字符串的形式，如上面的testArr，开启自定义输入，获取的值类似于:
    this.test = [{key: 'sdfgs'}, '自定义内容'];
*/
