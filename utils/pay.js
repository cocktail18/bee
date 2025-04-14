const WXAPI = require('apifm-wxapi')
const i18n = require("../i18n/index")
const $t = i18n.$t()
var util = require('../utils/util.js')

/**
 * type: order 支付订单 recharge 充值 paybill 优惠买单
 * data: 扩展数据对象，用于保存参数
 */
function wxpay(type, money, orderId, redirectUrl, data) {
  const postData = {
    token: wx.getStorageSync('token'),
    money: money,
    remark: "在线充值",
  }
  if (type === 'order') {
    postData.remark = "支付订单 ：" + orderId;
    postData.nextAction = {
      type: 0,
      id: orderId
    };
  }
  if (type === 'paybill') {
    postData.remark = $t.my.youhuimaidan + " ：" + data.money;
    postData.nextAction = {
      type: 4,
      uid: wx.getStorageSync('uid'),
      money: data.money
    };
  }
  postData.payName = postData.remark;
  if (postData.nextAction) {
    postData.nextAction = JSON.stringify(postData.nextAction);  
  }
  WXAPI.wxpay(postData).then(function (res) {
    if (res.code == 0) {
      // 发起支付
      wx.requestPayment({
        timeStamp: res.data.timeStamp,
        nonceStr: res.data.nonceStr,
        package: res.data.package,
        signType: res.data.signType,
        paySign: res.data.paySign,
        fail: function (aaa) {
          console.error(aaa)
          wx.showToast({
            title: aaa
          })
          if (redirectUrl) {
            wx.redirectTo({
              url: redirectUrl,
            })
          }
        },
        success: function () {
                //打印     
                if(data &&data.isPrint ==true){
                  //打印标签
                  print(data)
                  //打印小票
                  print2(data)
                }
                
     
          // 提示支付成功
          wx.showToast({
            title: $t.asset.success
          })
          if (redirectUrl) {
            wx.redirectTo({
              url: redirectUrl,
            })
          }
        }
      })
    } else {
      wx.showModal({
        confirmText: $t.common.confirm,
        cancelText: $t.common.cancel,
        content: JSON.stringify(res),
        showCancel: false
      })      
    }
  })
}

     //打印标签，参数为支付返回的data数据
     function    print(data){
  
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
      let timeStr = getDate()
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
    }
      //打印小票，参数为支付返回的data数据
      function     print2(data){
      
     
        //芯烨云打印接口
         let url = 'https://open.xpyun.net/api/openapi/xprinter/print'      
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
        let timeStr = getDate()
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
      }
       //获取当前年月日时分秒，打印时间
       function getDate(){
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



module.exports = {
  wxpay: wxpay
}