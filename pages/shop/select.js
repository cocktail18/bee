const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const APP = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.shop.select,
    })
    this.setData({
      type: options.type,
      shop_join_open: wx.getStorageSync('shop_join_open')
    })
    this.fetchShops(null, null, '')
  },
  onShow: function () {
    const that = this
    wx.getLocation({
      type: 'wgs84', //wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
      success: (res) => {
        this.data.latitude = res.latitude
        this.data.longitude = res.longitude
        this.fetchShops(res.latitude, res.longitude, '')
      },
      fail(e){
         // 定位失败时也获取店铺列表，但不传入位置参数
         this.fetchShops(null, null, '')
      }
    })    
  },
  async fetchShops(latitude, longitude, kw){
    const params = {
       nameLike: kw || ''
    }
    // 如果有位置信息，添加到请求参数中
    if (latitude && longitude) {
      params.curlatitude = latitude
      params.curlongitude = longitude
    }
    try {
      const res = await WXAPI.fetchShops(params)
      if (res.code == 0) {
        if (latitude && longitude) {
          res.data.forEach(ele => {
            ele.distance = ele.distance.toFixed(1)
          })
        } else {
          res.data.forEach(ele => {
            ele.distance = '-'
          })
        }
        this.setData({
          shops: res.data
        })
      } else {
        this.setData({
          shops: null
        })
      }
    } catch (error) {
      console.error('获取店铺列表失败:', error)
      wx.showToast({
        title: '获取店铺列表失败',
        icon: 'none'
      })
    }
  },
  searchChange(event){
    this.setData({
      searchValue: event.detail.value
    })
  },
  search(event){
    console.log('search')
    this.setData({
      searchValue: event.detail.value
    })
    this.fetchShops(this.data.latitude, this.data.longitude, event.detail.value)
  },
  goShop(e){
    const idx = e.currentTarget.dataset.idx    
    wx.setStorageSync('shopInfo', this.data.shops[idx])
    if (this.data.type == 'index') {
      wx.setStorageSync('refreshIndex', 1)
    }
    if (this.data.type == 'pay') {
      wx.navigateBack()
    } else {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
    
  },
  joinApply() {
    wx.navigateTo({
      url: '/pages/shop/join-apply',
    })
  },
})