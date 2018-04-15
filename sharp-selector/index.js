import app from 'App';
import './index.scss';

class SharpSelectorController {
  constructor($scope, $element, $attrs, $timeout, config) {
    this.services = { $scope, $element, $timeout, config };
    this.element = $element[0];

    this.removeOptionsWatch = $scope.$parent.$watchCollection($attrs.options, options => {
      this.options = options || [];
      this.currentValue = this.currentValue || '';
      const obj = this.findObj(this.options);
      if (obj !== undefined) {
        this.selectedLabel = this.getLabel(obj);
      }
      this.typeList = this.filterTypeList(this.options);
    });
  }

  $onInit() {
    const { config, $scope } = this.services;
    this.maxLength = config.get('select:maxLength');
    this.activeIndex = 0;
    this.editing = false;
    this.currentValue = '';
    this.options = this.options || [];
    this.ngModel.$render = () => {
      this.selectedValue = this.ngModel.$viewValue || '';
      if (this.options.length) {
        const obj = this.findObj(this.options);
        if (obj !== undefined) {
          this.selectedLabel = this.getLabel(obj);
        } else {
          this.selectedLabel = String(this.selectedValue);
        }
      } else {
        this.selectedLabel = String(this.selectedValue);
      }
    };
    this.uiViewElement = document.querySelector('ui-view');

    this.dismissClickHandler = evt => {
      if (!this.editing) return;
      if (!evt.target.matches('.select-input')) {
        this.editing = false;
        $scope.$apply();
      }
    };
    document.addEventListener('click', this.dismissClickHandler);
  }

  handleKeydown(evt) {
    switch (evt.key) {
      case 'Escape':
        evt.stopPropagation();
        this.editing = false;
        break;
      case 'ArrowUp':
        evt.preventDefault();
        this.activeIndex--;
        if (this.activeIndex < 0) {
          this.activeIndex = this.typeList.length - 1;
        }
        break;
      case 'ArrowDown':
        evt.preventDefault();
        this.activeIndex++;
        if (this.activeIndex > this.typeList.length - 1) {
          this.activeIndex = 0;
        }
        break;
      case 'Enter': {
        evt.preventDefault();
        const selectedItem = this.typeList[this.activeIndex];
        if (selectedItem !== undefined) {
          this.selectedValue = selectedItem.value;
          this.selectedLabel = selectedItem.label;
        } else {
          if (this.customizable) {
            this.selectedValue = this.selectedLabel = this.currentValue;
          } else {
            this.selectedValue = this.selectedLabel = '';
          }
        }
        this.setView();
        this.onSelect({
          $value: this.selectedValue,
          $object: selectedItem ? selectedItem.original : undefined,
          $event: evt,
        });
        this.editing = false;
        break;
      }
    }
  }

  $onDestroy() {
    document.removeEventListener('click', this.dismissClickHandler);
    this.uiViewElement.removeEventListener('scroll', this.scrollHandler);
    this.removeOptionsWatch();
  }

  removeSelect() {
    if (this.editing) {
      this.currentValue = '';
      this.activeIndex = 0;
      this.typeList = this.filterTypeList(this.options);
      this.element.querySelector('.select-input').focus();
    }
    this.selectedLabel = '';
    this.selectedValue = '';
    this.setView();
  }

  expand() {
    if (this.disabled) return;
    if (!this.editing) {
      const obj = this.findObj(this.options);
      if (obj !== undefined) {
        this.selectedLabel = this.getLabel(obj);
      }
      this.currentValue = '';
      this.typeList = this.filterTypeList(this.options);
      const foundIndex = this.typeList.findIndex(v => this.selectedValue === v.value);
      this.activeIndex = foundIndex !== -1 ? foundIndex : 0;
    }
    this.editing = !this.editing;
    this.resolveFixed();
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
        this.uiViewElement.addEventListener('scroll', this.scrollHandler, { once: true, passive: true });
      }
    } else {
      this.fixedListStyle = undefined;
    }
  }

  handleChange() {
    this.activeIndex = 0;
    if (this.remote) {
      this.remoteMethod({ value: this.currentValue });
    } else {
      this.typeList = this.filterTypeList(this.options);
    }
  }

  getValue($item) {
    const result = this.value({ $item });
    return result === undefined ? $item : result;
  }

  getLabel($item) {
    const result = this.label({ $item });
    return String(result === undefined ? $item : result);
  }

  filterTypeList(options) {
    this.activeIndex = 0;
    let typeList = options.map(v => {
      const label = this.getLabel(v);
      const value = this.getValue(v);
      const start = label.toUpperCase().indexOf(this.currentValue.toUpperCase());
      return { original: v, value, start, label };
    });
    if (this.currentValue) {
      typeList = typeList.filter(v => v.label.toUpperCase().includes(this.currentValue.toUpperCase()));
    }

    if (this.maxLength) {
      const sortArr = this.currentValue.length ? typeList.sort((a, b) => a.start - b.start) : typeList;
      sortArr.length = sortArr.length < this.maxLength ? sortArr.length : this.maxLength;
      return sortArr;
    } else {
      return typeList;
    }
  }

  selectIndex(index, evt) {
    const selectedItem = this.typeList[index];
    this.selectedValue = selectedItem.value;
    this.selectedLabel = selectedItem.label;
    this.setView();
    this.onSelect({
      $value: this.selectedValue,
      $object: selectedItem ? selectedItem.original : undefined,
      $event: evt,
    });
  }

  changeActiveIndex(index) {
    this.activeIndex = index;
  }

  setView() {
    this.ngModel.$setViewValue(this.selectedValue);
    this.ngModel.$render();
  }

  findObj(options) {
    return options.find(v => this.selectedValue === this.getValue(v));
  }

  getClass() {
    if (this.disabled) {
      return 'input-disabled';
    } else {
      if (this.editing) {
        return 'bottom-radius-none not-disabled';
      } else {
        return 'not-disabled';
      }
    }
  }

  wrapTrackBy(item) {
    const result = this.trackBy({ $item: item.original });
    return result === undefined ? item.value : result;
  }
}

SharpSelectorController.$inject = ['$scope', '$element', '$attrs', '$timeout', 'config'];

app.component('sharpSelector', {
  require: {
    ngModel: '^ngModel'
  },
  controller: SharpSelectorController,
  template: require('./index.html'),
  bindings: {
    placeholder: '@',      // 输入框占位，String
    label: '&',            // 如是对象数组时，label可以选择的对象显示属性值String，如"obj.b"则为"b"，也可以为函数function，return String
    value: '&',            // 同label
    required: '<',         // 是否必选，Boolean，默认false
    disabled: '<',         // 是否不可选，Boolean，默认false
    customizable: '<',     // 用户是否可以自定义内容，Boolean，默认false
    isLoading: '<',        // 加载效果，Boolean，默认false
    remote: '<',           // 是否远程搜索，Boolean，默认false
    fixed: '<',            // 是否fixed定位
    overflow: '<',         // 文字是否溢出
    onSelect: '&',         // 用户选中选项的时候触发
    remoteMethod: '&',     // 远程搜索方法
    trackBy: '&',          // 用于 track by 的值
  },
});
