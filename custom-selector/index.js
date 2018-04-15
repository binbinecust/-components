import app from 'App';
import _ from 'lodash';
import { DayDataOptions } from 'Constants';

import './index.scss';

class CustomSelectorController {
  constructor($scope, $uibModal, Notifier) {
    this.notify = new Notifier({
      location: '自定义选择框',
    });
    $scope.$watch('$ctrl.customVal', (newval, oldval) => {
      this.lastVal = oldval;
      if (!newval) {
        const custome = this.units.find(item => item.value === this.customUnit);
        $uibModal.open({
          component: 'valueInput',
          openedClass: 'input-width',
          resolve: {
            minValue: () => custome.minValue,
            maxValue: () => custome.maxValue,
            title: () => this.title,
            customUnit: () => this.customUnit,
          }
        })
        .result
        .then((data) => {
          if (!data) {
            this.customVal = this.lastVal;
            return this.onChange();
          }
          if (this.options.some(item => item.type === 'custome')) {
            this.options[this.options.length - 1] = {key: data, value: data, type: 'custome'};
          } else {
            this.options.push({key: data, value: data, type: 'custome'});
          }
          this.customVal = data;
          this.onChange();
        })
        .catch(e => {
          if (e) this.notify.warning(e.message);
        });
      } else {
        this.options = this.options.filter(item => item.type !== 'custome');
        const matched = this.options.find(item => String(item.value) === String(newval));
        if (!matched) {
          this.options.push({key: newval, value: newval, type: 'custome'});
        }
      }
    });
  }

  $onInit() {
    this.options = this.options || _.cloneDeep(DayDataOptions);
    this.units = this.units || [{label: 'GB', value: 'GB', minValue: 0, maxValue: 2000}];
    this.customUnit = this.customUnit || 'GB';
    const matched = this.options.find(item => String(item.value) === String(this.customVal));
    if (!matched) {
      this.options.push({ key: this.customVal, value: this.customVal, type: 'custome' });
    }
  }
}

CustomSelectorController.$inject = ['$scope', '$uibModal', 'Notifier'];
app
  .component('customSelector',{
    template: require('./index.html'),
    transclude: true,
    bindings: {
      options: '<',
      customVal: '=',
      customUnit: '=?',
      units: '<',
      title: '@',
      isDisabled: '<?',
      isDisabledUnit: '<?',
      onChange: '&',
    },
    controller: CustomSelectorController
  });
