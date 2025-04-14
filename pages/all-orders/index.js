const wxpay = require('../../utils/pay.js')
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const APP = getApp()
var util = require('../../utils/util.js')
APP.configLoadOK = () => {

}
Page({
  data: {
    apiOk: false,
    dataP:''
  },
  cancelOrderTap: function(e) {
    const that = this;
    const orderId = e.currentTarget.dataset.id;
    wx.showModal({
      confirmText: this.data.$t.common.confirm,
      cancelText: this.data.$t.common.cancel,
      content: this.data.$t.order.cancelProfile,
      success: function(res) {
        if (res.confirm) {
          WXAPI.orderClose(wx.getStorageSync('token'), orderId).then(function(res) {
            if (res.code == 0) {
              that.onShow();
            }
          })
        }
      }
    })
  },
  toPayTap: function(e) {
    // 防止连续点击--开始
    if (this.data.payButtonClicked) {
      wx.showToast({
        title: this.data.$t.common.doubleClick,
        icon: 'none'
      })
      return
    }
    this.data.payButtonClicked = true
    setTimeout(() => {
      this.data.payButtonClicked = false
    }, 3000)  // 可自行修改时间间隔（目前是3秒内只能点击一次支付按钮）
    // 防止连续点击--结束
    const that = this;
    const orderId = e.currentTarget.dataset.id;
    let money = e.currentTarget.dataset.money;
    const needScore = e.currentTarget.dataset.score;
    WXAPI.userAmount(wx.getStorageSync('token')).then(function(res) {
      if (res.code == 0) {
        // 增加提示框
        if (res.data.score < needScore) {
          wx.showToast({
            title: that.data.$t.order.scoreNotEnough,
            icon: 'none'
          })
          return;
        }
        let _msg = that.data.$t.order.amountReal + ' ' + money
        if (res.data.balance > 0) {
          _msg += ' ' + that.data.$t.order.balance + ' ' + res.data.balance
          if (money - res.data.balance > 0) {
            _msg += ' ' + that.data.$t.order.payAmount + ' ' + (money - res.data.balance)
          }          
        }
        if (needScore > 0) {
          _msg += ' ' + that.data.$t.order.payScore + ' ' + needScore
        }
        money = money - res.data.balance
        wx.showModal({
          content: _msg,
          confirmText: that.data.$t.common.confirm,
          cancelText: that.data.$t.common.cancel,
          success: function (res) {
            console.log(res);
            if (res.confirm) {
              that._toPayTap(orderId, money)
            }
          }
        });
      } else {
        wx.showModal({
          confirmText: that.data.$t.common.confirm,
          cancelText: that.data.$t.common.cancel,
          content: that.data.$t.order.noCashAccount,
          showCancel: false
        })
      }
    })
  },
  _toPayTap: function (orderId, money){
    const _this = this
      // console.log(orderId)
      // console.log(wx.getStorageSync(orderId))
      //未支付的现金订单，从本地缓存中获取订单信息
         _this.data.dataP = ''
      try{
        _this.data.dataP = wx.getStorageSync(orderId +"O")
        console.log("缓存中取出的打印数据：",  _this.data.dataP)
      }
      catch(e){
        console.log("缓存中取出的打印数据报错：",e)
      }
      
    if (money <= 0) {
      // 直接使用余额支付
      WXAPI.orderPay(wx.getStorageSync('token'), orderId).then(function (res) {
        console.log("余额支付：",r)
        if(r.code==700 &&_this.data.dataP){
            //打印的数据
            if(_this.data.dataP && _this.data.dataP ===true){
      
            //小票
            that.print2(_this.data.dataP)
            //标签
            that.print(_this.data.dataP)
            }

        }
        _this.onShow();
      })
    } else {
      //缓存中有打印信息
      if(_this.data.dataP){
        wxpay.wxpay('order', money, orderId, "/pages/all-orders/index",_this.data.dataP); 

      }//缓存中无打印信息
      else{
        wxpay.wxpay('order', money, orderId, "/pages/all-orders/index"); 
      }
    
     
      
     }
  },
  onLoad: function(options) {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.order.title,
    })
  },
  onShow: function() {
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        this.doneShow();
      } else {
        wx.showModal({
          confirmText: this.data.$t.common.confirm,
          cancelText: this.data.$t.common.cancel,
          content: this.data.$t.auth.needLogin,
          showCancel: false,
          success: () => {
            wx.navigateBack()
          }
        })
      }
    })
  },
  async doneShow() {
    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.orderList({
      token: wx.getStorageSync('token')
    })
    wx.hideLoading()
    if (res.code == 0) {
      const orderList = res.data.orderList
      orderList.forEach(ele => {
        if (ele.status == -1) {
          ele.statusStr = this.data.$t.order.status.st01
        }
        if (ele.status == 1 && ele.isNeedLogistics) {
          ele.statusStr = this.data.$t.order.status.st11
        }
        if (ele.status == 1 && !ele.isNeedLogistics) {
          ele.statusStr = this.data.$t.order.status.st10
        }
        if (ele.status == 3) {
          ele.statusStr = this.data.$t.order.status.st3
        }
      })
      this.setData({
        orderList: res.data.orderList,
        logisticsMap: res.data.logisticsMap,
        goodsMap: res.data.goodsMap,
        apiOk: true
      });
      
    } else {
      this.setData({
        orderList: null,
        logisticsMap: {},
        goodsMap: {},
        apiOk: true
      });
    }
  },
  toIndexPage: function() {
    wx.switchTab({
      url: "/pages/index/index"
    });
  },
  // 删除订单
  deleteOrder: function(e){
    const that = this
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      confirmText: this.data.$t.common.confirm,
      cancelText: this.data.$t.common.cancel,
      content: this.data.$t.order.deleteProfile,
      success: function (res) {
        if (res.confirm) {
          WXAPI.orderDelete(wx.getStorageSync('token'), id).then(function (res) {  
            if (res.code == 0) {
              that.onShow(); //重新获取订单列表
            }              
            
          })
        }
      }
    })
  },
  async callShop(e) {
    const shopId = e.currentTarget.dataset.shopid
    const res = await WXAPI.shopSubdetail(shopId)
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    wx.makePhoneCall({
      phoneNumber: res.data.info.linkPhone,
    })
  },
     //打印标签，参数为支付返回的data数据
     print(data){
      var that = this
      //芯烨云打印接口
       let url = 'https://open.xpyun.net/api/openapi/xprinter/printLabel'      
       //开发者密钥
       let userKey = 'b2e9014204774a058bc7e8640e36e8ed'
       //开发者id xu1271669848@gmail.com
       let userId = 'xu1271669848@gmail.com'
       let timstamp = Math.trunc(new Date().getTime()/1000) + ""
       let sign = userId + userKey + timstamp
        //打印机序列号，店铺id对应打印机序列号
        let sn = ''
        //紫金店
        if(data.shopInfo.id==2){
          sn = '32817SCU1VAF54B'

        }//未来店
        else if (data.shopInfo.id==1){
          sn = '32EL21088705948'
        }
        //塘下店
        else if (data.shopInfo.id==4){
          sn = '325Z1VC2ANA044B'
      }
      //瑞安店
      else if (data.shopInfo.id==3){
          sn = '32EVUCUVY0B4848'
      }




        //如果没有打印机，则返回
        if(!sn){
          return
        }
            //当前日期 时分秒
      let timeStr = that.getDate()
      let content = ''
       
    for(let i=0;i<data.goodsList.length;i++){
      for(let k=0;k<data.goodsList[i].number;k++){
      content+= '<PAGE><SIZE>40,30</SIZE>' + 
      '<TEXT x="8" y="0" w="1" h="1" r="0"># '+(i+1) +'/' + data.goodsList.length + ' 总金额:'+data.data.amountReal + '</TEXT>'+
      '<TEXT x="8" y="24" w="1" h="1" r="0">'+ data.goodsList[i].name +'</TEXT>'
      for(let j=0;j<data.goodsList[i].sku.length;j++){
        content+='<TEXT x="8" y="' + (j+2)*24 +'" w="1" h="1" r="0">'+ data.goodsList[i].sku[j].optionValueName +'</TEXT>'
      }
      content+= '<TEXT x="8" y="'+(data.goodsList[i].sku.length+2)*24 +'" w="1" h="1" r="0">'+'单价: ￥'+data.goodsList[i].price + '</TEXT>'+
      '<TEXT x="8" y="166" w="1" h="1" r="0">'+ data.data.orderNumber+ '</TEXT>'+ 
      '<TEXT x="8" y="190" w="1" h="1" r="0">'+ timeStr + '</TEXT>'+ 
      '<TEXT x="8" y="214" w="1" h="1" r="0">'+ data.shopInfo.name + '</TEXT>' +   '</PAGE>'

    }
  }
      

       //请求参数
       let param = {
         user: userId,
         timestamp: timstamp,
         sign: util.sha1(sign),
         sn: sn,
         content: content
         }
         console.log(param)
          
     let header = {
       "Content-Type": "application/json;charset=UTF-8"
     }
   
       wx.request({
         url: url,
         data: param,
         method: "post",
         header:header,
         success: res=>{
           console.log("标签打印返回：",res)
         }
        
         
       })
    },
      //打印小票，参数为支付返回的data数据
      print2(data){
        var that = this
     
        //芯烨云打印接口
         let url = 'https://open.xpyun.net/api/openapi/xprinter/print'      
         //开发者密钥
         let userKey = 'b2e9014204774a058bc7e8640e36e8ed'
         //开发者id xu1271669848@gmail.com
         let userId = 'xu1271669848@gmail.com'
         let timstamp = Math.trunc(new Date().getTime()/1000) + ""
         let sign = userId + userKey + timstamp
          //小票机序列号，店铺id对应小票机序列号
          let sn = ''
          //紫金店
          if(data.shopInfo.id==2){
            sn = '74Y4LWMD9R9AF4B'
          }
          //未来店
        else if (data.shopInfo.id==1){
          sn = '742N30GDRND8E4A'
        }
                //塘下店
        else if (data.shopInfo.id==4){
          sn = '74S8LPEQ3584048'
        }
        //瑞安店
        else if (data.shopInfo.id==3){
          sn = '744905VQE26ED4A'
        }

        
          //如果没有打印机，则返回
          if(!sn){
            return
          }
              //当前日期 时分秒
        let timeStr = that.getDate()
        let content = '<CB>9.8 COFFEE<BR><BR><BR></CB>' +'<TABLE col="22,3,7" w=1 h=1 b=0 lh=68> '
         
      for(let i=0;i<data.goodsList.length;i++){
        content+=  '<tr>'+ data.goodsList[i].name +'<td>' + data.goodsList[i].number +'<td>' + data.goodsList[i].price + '元</tr>'
        content+='<tr>|'
        for(let j=0;j<data.goodsList[i].sku.length;j++){
          content+=data.goodsList[i].sku[j].optionValueName + '|' 
        }
        content+='<td> <td> </tr>'
      }
      content+='</TABLE>'
      content+='<R>合计：'+ data.data.amountReal+'元<BR></R><BR>'

      content+= '<L>下单时间: '+ timeStr + '<BR>'+ 
      '订单编号: '+ data.data.orderNumber + '<BR>' +
      '用户电话: '+ data.mobile + '<BR>' 
      if(data.peisongType =='pszq'){
        content+= '用户地址: '+ data.address + '<BR>' 
      }
      // if(that.data.peisongType=='zq'){
      //   content+= ' 取单号: '+that.data.curAddressData.address + '<BR>' 
      // }
      content+=  '门店名称: ' + data.shopInfo.name +'<BR>'+
      '备注: ' + data.remark +'<BR>'
      content+= '</L>' 
        
  
         //请求参数
         let param = {
           user: userId,
           timestamp: timstamp,
           sign: util.sha1(sign),
           sn: sn,
           content: content
           }
           console.log(param)
            
       let header = {
         "Content-Type": "application/json;charset=UTF-8"
       }
     
         wx.request({
           url: url,
           data: param,
           method: "post",
           header:header,
           success: res=>{
             console.log("小票打印返回：",res)
           }
          
           
         })
      },
       //获取当前年月日时分秒，打印时间
getDate(){
  var now = new Date();
var year = now.getFullYear(); // 年
var month = now.getMonth() + 1; // 月
var day = now.getDate(); // 日
var hour = now.getHours(); // 时
var minute = now.getMinutes(); // 分
var second = now.getSeconds(); // 秒

// 格式化输出
var timeString = year + "-" + (month < 10 ? "0" + month : month) + "-" + (day < 10 ? "0" + day : day) + " " + (hour < 10 ? "0" + hour : hour) + ":" + (minute < 10 ? "0" + minute : minute) + ":" + (second < 10 ? "0" + second : second);
return timeString

}
})