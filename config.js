module.exports = {
  version: "5.1.2",
  note: 'fixed:未登录状态下，确认订单页面，合计显示未 underfined',
  apiHost: 'http://127.0.0.1:18083',
  // apiHost: 'https://api.it120.cc',//api工厂的值
  subDomain: "cocktailBeeOrder", // 固定值
  customerServiceType: 'QW' // 客服类型，QW为企业微信，需要在后台系统参数配置企业ID和客服URL，否则为小程序的默认客服
}