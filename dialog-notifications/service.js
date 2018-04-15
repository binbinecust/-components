import app from 'App';

app.factory('Dialog', ['$uibModal', function ($uibModal) {
  return {
    alert(obj) {
      if (typeof obj !== 'object') {
        obj = {
          msg: obj + '',
        };
      }
      return $uibModal.open({
        component: 'dialogNotifications',
        size: obj.size || 'sm',
        resolve: {
          items: () => {
            return {
              type: 'alert',
              title: obj.title || '提示',
              content: obj.msg,
              btnOk: obj.btnOk || '确认'
            };
          }
        }
      }).result.catch(() => {});
    },

    confirm(obj) {
      if (typeof obj !== 'object') {
        obj = {
          msg: obj + '',
        };
      }
      return $uibModal.open({
        component: 'dialogNotifications',
        size: obj.size || 'sm',
        resolve: {
          items: () => {
            return {
              type: 'confirm',
              title: obj.title || '提示',
              content: obj.msg,
              btnOk: obj.btnOk || '确认',
              btnCancel: obj.btnCancel || '取消',
              size: obj.size || 'sm',
            };
          }
        },
      }).result.catch(() => { throw undefined; });
    },
  };
}]);
