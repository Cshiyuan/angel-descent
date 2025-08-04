
### 新手指南
小游戏项目结构
├── game.js
├── game.json
├── project.config.json
└── project.private.config.json
小游戏核心的目录结构主要以以上 4 个文件为主

project.config.json和project.private.config.json是项目配置文件，是项目编辑时的配置，具体字段详情点击查看配置介绍

game.json是游戏的配置文件，是游戏运行时的配置，具体字段详情点击查看配置介绍

game.js是游戏执行逻辑的主入口，示例项目中的其他代码和资源均为game.js的引用

注意：如果在project.config.json中配置了miniprogramRoot，则game.js和game.json可以和project.config.json不在同一级目录中

例如创建项目时选择了【微信云开发】模板，则目录结构为

├── cloudfunction
├── miniprogram
│   ├── game.js
│   ├── game.json
├── project.config.json
└── project.private.config.json
 上动态运行并响应用户的输入。

我们解读一下本示例游戏中几个关键的游戏逻辑构成

1. 初始化Canvas
canvas = wx.createCanvas(); // 创建Canvas画布
ctx = canvas.getContext("2d"); // 获取canvas的2D绘图上下文
我们需要绘制画面到屏幕上，首选需要创建一个 Canvas，并获取 Canvas 的 2D 渲染上下文，用于绘制图形。

如果你有引入 weapp-adapter，在 weapp-adapter 中默认会创建一个 Canvas 做为主屏 Canvas

wx.createCanvas()有一个规则：首次调用创建的是显示在屏幕上的画布，之后调用创建的都是离屏画布。



3. 游戏帧循环

游戏帧循环是游戏运行过程中的核心概念。

loop() 方法是游戏的主循环，负责更新游戏状态并渲染画面。通过requestAnimationFrame，我们实现了流畅的动画效果。每个游戏帧循环都会调用loop函数，以计算游戏逻辑并绘制游戏画面。

update() 方法主要用于计算和更新游戏状态，包括背景、玩家、子弹和敌机的位置，生成敌机，以及检测碰撞等。

render() 方法负责绘制所有游戏元素，包括背景、玩家、敌机、子弹、动画和分数，并处理游戏结束时的逻辑。

4. 数据和状态管理
维护游戏的当前状态和记录游戏数据至关重要，因为这些数据决定了游戏的进度和需要展示的 UI 信息。

在本示例中，我们通过DataBus类来管理游戏的状态和数据，记录用户的分数，判断游戏是否结束。在游戏帧循环的update和render阶段，都会根据当前的数据进行逻辑判断和调整。

5. 游戏对象管理
在游戏开发中，Sprite是一个非常重要的概念，通常指的是在2D图形中使用的图像或动画的单个对象，是游戏对象的基本单元。

我们在Main类中管理游戏中的各种对象，如玩家、敌机、子弹等，负责它们的创建、更新、绘制、销毁等。

如果你已阅读了示例源码的话，可以发现玩家、敌机、子弹等都继承自Sprite这个游戏精灵类，并且每个游戏对象都有独立的update和render方法，方便进行统一的管理和维护。

6. 增加交互
通过绑定触摸事件或者监听陀螺仪等微信API提供的交互方式，可以允许玩家与游戏进行互动。

在本示例中，我们希望用户和飞机进行交互，我们在js/player/index.js中，通过wx.onTouchStart()、wx.onTouchMove()、wx.onTouchEnd()、wx.onTouchCancel()这几个监听触摸事件，来判断用户是否与屏幕交互，当用户的手指在 Player 这个飞机上进行按住并拖动时，可以实现飞机跟随的手指移动的效果。

跟随拖动的原理是：当手指按住时，我们通过checkIsFingerOnAir判断是否按在了飞机的区域，当手指拖动时，判断是否已经按住，然后根据wx.onTouchMove中获取的屏幕上按住的x和y坐标的位置，重新计算飞机的x和y的位置，当下一次render时，会根据最新的x和y进行渲染，屏幕上的飞机也就跟着移动了。

7. 增强反馈
合理的增加游戏中的动画，音乐，音效，震动等，可以增强游戏的沉浸感。


8. 总结
游戏开发有几个重要的考虑因素，例如设计好架构以确保代码的模块化和可扩展性，管理好游戏状态和数据，管理好游戏对象等等。



### API列表

微信开放文档 /API
以下服务端接口可免 access_token 调用的场景：使用微信云托管通过微信令牌/开放接口服务调用；使用微信云开发通过云函数免服务器发起云调用。  

基础
名称	功能
wx.env	环境变量
系统	
名称	功能
wx.openSystemBluetoothSetting	跳转系统蓝牙设置页
wx.openAppAuthorizeSetting	跳转系统微信授权管理页
wx.getWindowInfo	获取窗口信息
wx.getSystemSetting	获取设备设置
wx.getSystemInfoSync	wx.getSystemInfo 的同步版本
wx.getSystemInfoAsync	异步获取系统信息
wx.getSystemInfo	获取系统信息
wx.getDeviceInfo	获取设备基础信息
wx.getDeviceBenchmarkInfo	获取设备性能得分和机型档位数据
wx.getAppBaseInfo	获取微信APP基础信息
wx.getAppAuthorizeSetting	获取微信APP授权设置
更新	
名称	功能
wx.updateWeChatApp	更新客户端版本
wx.getUpdateManager	获取全局唯一的版本更新管理器，用于管理小程序更新
UpdateManager	UpdateManager 对象，用来管理更新，可通过 wx.getUpdateManager 接口获取实例
名称	功能
UpdateManager.applyUpdate	强制小程序重启并使用新版本
UpdateManager.onCheckForUpdate	监听向微信后台请求检查更新结果事件
UpdateManager.onUpdateFailed	监听小程序更新失败事件
UpdateManager.onUpdateReady	监听小程序有版本更新事件
生命周期	
名称	功能
wx.onShow	监听小游戏回到前台的事件
wx.onHide	监听小游戏隐藏到后台事件
wx.offShow	移除小游戏回到前台的事件的监听函数
wx.offHide	移除小游戏隐藏到后台事件的监听函数
wx.getLaunchOptionsSync	获取小游戏冷启动时的参数
wx.getEnterOptionsSync	获取小游戏打开的参数（包括冷启动和热启动）
应用级事件	
名称	功能
wx.onUnhandledRejection	监听未处理的 Promise 拒绝事件
wx.onError	监听全局错误事件
wx.onAudioInterruptionEnd	监听音频中断结束事件
wx.onAudioInterruptionBegin	监听音频因为受到系统占用而被中断开始事件
wx.offUnhandledRejection	移除未处理的 Promise 拒绝事件的监听函数
wx.offError	移除全局错误事件的监听函数
wx.offAudioInterruptionEnd	移除音频中断结束事件的监听函数
wx.offAudioInterruptionBegin	移除音频因为受到系统占用而被中断开始事件的监听函数
性能	
名称	功能
wx.triggerGC	加快触发 JavaScriptCore 垃圾回收（Garbage Collection）
wx.reportPerformance	小程序测速上报
wx.getPerformance	获取性能管理器
Performance	性能管理器
名称	功能
Performance.now	可以获取当前时间以微秒为单位的时间戳
分包加载	
名称	功能
wx.preDownloadSubpackage	触发分包预下载
wx.loadSubpackage	触发分包加载，详见 分包加载
LoadSubpackageTask	加载分包任务实例，用于获取分包加载状态
名称	功能
LoadSubpackageTask.onProgressUpdate	监听分包加载进度变化事件
PreDownloadSubpackageTask	预下载分包任务实例，用于获取分包预下载状态
名称	功能
PreDownloadSubpackageTask.onProgressUpdate	监听分包加载进度变化事件
调试	
名称	功能
wx.setEnableDebug	设置是否打开调试开关
wx.getRealtimeLogManager	获取实时日志管理器对象
wx.getLogManager	获取日志管理器对象
console	向调试面板中打印日志
名称	功能
console.debug	向调试面板中打印 debug 日志
console.error	向调试面板中打印 error 日志
console.group	在调试面板中创建一个新的分组
console.groupEnd	结束由 console.group 创建的分组
console.info	向调试面板中打印 info 日志
console.log	向调试面板中打印 log 日志
console.warn	向调试面板中打印 warn 日志
LogManager	日志管理器实例，可以通过 wx.getLogManager 获取
名称	功能
LogManager.debug	写 debug 日志
LogManager.info	写 info 日志
LogManager.log	写 log 日志
LogManager.warn	写 warn 日志
RealtimeLogManager	实时日志管理器实例，可以通过 wx.getRealtimeLogManager 获取
名称	功能
RealtimeLogManager.addFilterMsg	添加过滤关键字，暂不支持在插件使用
RealtimeLogManager.error	写 error 日志，暂不支持在插件使用
RealtimeLogManager.info	写 info 日志，暂不支持在插件使用
RealtimeLogManager.setFilterMsg	设置过滤关键字，暂不支持在插件使用
RealtimeLogManager.warn	写 warn 日志，暂不支持在插件使用
加密	
名称	功能
wx.getUserCryptoManager	获取用户加密模块
UserCryptoManager	用户加密模块
名称	功能
UserCryptoManager.getLatestUserKey	获取最新的用户加密密钥
UserCryptoManager.getRandomValues	获取密码学安全随机数

跳转
名称	功能
wx.restartMiniProgram	重启当前小程序
wx.navigateToMiniProgram	打开另一个小程序
wx.navigateBackMiniProgram	返回到上一个小程序
wx.exitMiniProgram	退出当前小程序

转发
名称	功能
wx.updateShareMenu	更新转发属性
wx.startHandoff	开始进行接力，该接口需要在开放数据域调用
wx.showShareMenu	设置右上角点开的详情界面中的分享按钮是否可用
wx.showShareImageMenu	打开分享图片弹窗，可以将图片发送给朋友、收藏或下载
wx.shareAppMessage	主动拉起转发，进入选择通讯录界面
wx.setMessageToFriendQuery	设置 wx.shareMessageToFriend 接口 query 字段的值
wx.setHandoffQuery	设置接力参数，该接口需要在游戏域调用
wx.onShareTimeline	监听用户点击右上角菜单的「分享到朋友圈」按钮时触发的事件
wx.onShareMessageToFriend	监听主域接收wx.shareMessageToFriend接口的成功失败通知事件
wx.onShareAppMessage	监听用户点击右上角菜单的「转发」按钮时触发的事件
wx.onHandoff	监听用户点击菜单「在电脑上打开」按钮时触发的事件
wx.onCopyUrl	监听用户点击右上角菜单的「复制链接」按钮时触发的事件
wx.onAddToFavorites	监听用户点击菜单「收藏」按钮时触发的事件
wx.offShareTimeline	移除用户点击右上角菜单的「分享到朋友圈」按钮时触发的事件的监听函数
wx.offShareMessageToFriend	移除主域接收wx.shareMessageToFriend接口的成功失败通知事件的监听函数
wx.offShareAppMessage	移除用户点击右上角菜单的「转发」按钮时触发的事件的监听函数
wx.offHandoff	移除用户点击菜单「在电脑上打开」按钮时触发的事件的全部监听函数
wx.offCopyUrl	移除用户点击右上角菜单的「复制链接」按钮时触发的事件的全部监听函数
wx.offAddToFavorites	移除用户点击菜单「收藏」按钮时触发的事件的全部监听函数
wx.hideShareMenu	隐藏当前页面的转发按钮
wx.getShareInfo	获取转发详细信息（主要是获取群ID）
wx.checkHandoffEnabled	检查是否可以进行接力，该接口需要在开放数据域调用
wx.authPrivateMessage	验证私密消息

聊天工具
名称	功能
wx.shareVideoToGroup	转发视频到聊天
wx.shareTextToGroup	转发文本到聊天
wx.shareImageToGroup	转发图片到聊天
wx.shareEmojiToGroup	转发表情到聊天
wx.shareAppMessageToGroup	转发小程序卡片到聊天
wx.selectGroupMembers	选择聊天室的成员，并返回选择成员的 group_openid
wx.openChatTool	进入聊天工具模式
wx.notifyGroupMembers	提醒用户完成任务，标题长度不超过 30 个字符，支持中英文和数字，中文算2个字符
wx.isChatTool	是否处于聊天工具模式
wx.getChatToolInfo	获取聊天工具模式下的群聊信息
wx.exitChatTool	退出聊天工具模式

界面
名称	功能
交互	
名称	功能
wx.showToast	显示消息提示框
wx.showModal	显示模态对话框
wx.showLoading	显示 loading 提示框
wx.showActionSheet	显示操作菜单
wx.hideToast	隐藏消息提示框
wx.hideLoading	隐藏 loading 提示框
菜单	
名称	功能
wx.setMenuStyle	动态设置通过右上角按钮拉起的菜单的样式
wx.onOfficialComponentsInfoChange	监听官方组件信息变化事件
wx.offOfficialComponentsInfoChange	移除官方组件信息变化事件的监听函数
wx.getOfficialComponentsInfo	获取所有官方组件的相关信息
wx.getMenuButtonBoundingClientRect	获取菜单按钮（右上角胶囊按钮）的布局位置信息
状态栏	
名称	功能
wx.setStatusBarStyle	当在配置中设置 showStatusBar 时，屏幕顶部会显示状态栏
窗口	
名称	功能
wx.setWindowSize	设置窗口大小，该接口仅适用于 PC 平台，使用细则请参见指南
wx.onWindowStateChange	监听小程序窗口状态变化事件
wx.onWindowResize	监听窗口尺寸变化事件
wx.offWindowStateChange	移除小程序窗口状态变化事件的监听函数
wx.offWindowResize	移除窗口尺寸变化事件的监听函数

网络
名称	功能
发起请求	
名称	功能
wx.request	发起 HTTPS 网络请求
RequestTask	网络请求任务对象
名称	功能
RequestTask.abort	中断请求任务
RequestTask.offChunkReceived	移除 Transfer-Encoding Chunk Received 事件的监听函数
RequestTask.offHeadersReceived	移除 HTTP Response Header 事件的监听函数
RequestTask.onChunkReceived	监听 Transfer-Encoding Chunk Received 事件
RequestTask.onHeadersReceived	监听 HTTP Response Header 事件
下载	
名称	功能
wx.downloadFile	下载文件资源到本地
DownloadTask	一个可以监听下载进度变化事件，以及取消下载任务的对象
名称	功能
DownloadTask.abort	中断下载任务
DownloadTask.offHeadersReceived	移除 HTTP Response Header 事件的监听函数
DownloadTask.offProgressUpdate	移除下载进度变化事件的监听函数
DownloadTask.onHeadersReceived	监听 HTTP Response Header 事件
DownloadTask.onProgressUpdate	监听下载进度变化事件
上传	
名称	功能
wx.uploadFile	将本地资源上传到服务器
UploadTask	一个可以监听上传进度变化事件，以及取消上传任务的对象
名称	功能
UploadTask.abort	中断上传任务
UploadTask.offHeadersReceived	移除 HTTP Response Header 事件的监听函数
UploadTask.offProgressUpdate	移除上传进度变化事件的监听函数
UploadTask.onHeadersReceived	监听 HTTP Response Header 事件
UploadTask.onProgressUpdate	监听上传进度变化事件
WebSocket	
名称	功能
wx.sendSocketMessage	通过 WebSocket 连接发送数据
wx.onSocketOpen	监听 WebSocket 连接打开事件
wx.onSocketMessage	监听 WebSocket 接收到服务器的消息事件
wx.onSocketError	监听 WebSocket 错误事件
wx.onSocketClose	监听 WebSocket 连接关闭事件
wx.connectSocket	创建一个 WebSocket 连接
wx.closeSocket	关闭 WebSocket 连接
SocketTask	WebSocket 任务，可通过 wx.connectSocket() 接口创建返回
名称	功能
SocketTask.close	关闭 WebSocket 连接
SocketTask.onClose	监听 WebSocket 连接关闭事件
SocketTask.onError	监听 WebSocket 错误事件
SocketTask.onMessage	监听 WebSocket 接收到服务器的消息事件
SocketTask.onOpen	监听 WebSocket 连接打开事件
SocketTask.send	通过 WebSocket 连接发送数据
TCP 通信	
名称	功能
wx.createTCPSocket	创建一个 TCP Socket 实例
TCPSocket	一个 TCP Socket 实例，默认使用 IPv4 协议
名称	功能
TCPSocket.bindWifi	将 TCP Socket 绑定到当前 wifi 网络，成功后会触发 onBindWifi 事件（仅安卓支持）
TCPSocket.close	关闭连接
TCPSocket.connect	在给定的套接字上启动连接
TCPSocket.offBindWifi	移除当一个 socket 绑定当前 wifi 网络成功时触发该事件的监听函数
TCPSocket.offClose	移除一旦 socket 完全关闭就发出该事件的监听函数
TCPSocket.offConnect	移除当一个 socket 连接成功建立的时候触发该事件的监听函数
TCPSocket.offError	移除当错误发生时触发的监听函数
TCPSocket.offMessage	移除当接收到数据的时触发该事件的监听函数
TCPSocket.onBindWifi	监听当一个 socket 绑定当前 wifi 网络成功时触发该事件
TCPSocket.onClose	监听一旦 socket 完全关闭就发出该事件
TCPSocket.onConnect	监听当一个 socket 连接成功建立的时候触发该事件
TCPSocket.onError	监听当错误发生时触发
TCPSocket.onMessage	监听当接收到数据的时触发该事件
TCPSocket.write	在 socket 上发送数据
UDP 通信	
名称	功能
wx.createUDPSocket	创建一个 UDP Socket 实例
UDPSocket	一个 UDP Socket 实例，默认使用 IPv4 协议
名称	功能
UDPSocket.bind	绑定一个系统随机分配的可用端口，或绑定一个指定的端口号
UDPSocket.close	关闭 UDP Socket 实例，相当于销毁
UDPSocket.connect	预先连接到指定的 IP 和 port，需要配合 write 方法一起使用
UDPSocket.offClose	移除关闭事件的监听函数
UDPSocket.offError	移除错误事件的监听函数
UDPSocket.offListening	移除开始监听数据包消息的事件的监听函数
UDPSocket.offMessage	移除收到消息的事件的监听函数
UDPSocket.onClose	监听关闭事件
UDPSocket.onError	监听错误事件
UDPSocket.onListening	监听开始监听数据包消息的事件
UDPSocket.onMessage	监听收到消息的事件
UDPSocket.send	向指定的 IP 和 port 发送消息
UDPSocket.setTTL	设置 IP_TTL 套接字选项，用于设置一个 IP 数据包传输时允许的最大跳步数
UDPSocket.write	用法与 send 方法相同，如果没有预先调用 connect 则与 send 无差异（注意即使调用了 connect 也需要在本接口填入地址和端口参数）

虚拟支付
名称	功能
wx.requestMidasPaymentGameItem	发起道具直购支付请求，可参考虚拟支付2.0道具直购，虚拟支付全流程可参考技术手册-虚拟支付篇
wx.requestMidasPayment	发起购买游戏币支付请求，可参考虚拟支付2.0游戏币，虚拟支付全流程可参考技术手册-虚拟支付篇
wx.requestMidasFriendPayment	发起米大师朋友礼物索要

数据缓存
名称	功能
wx.setStorageSync	将数据存储在本地缓存中指定的 key 中
wx.setStorage	将数据存储在本地缓存中指定的 key 中
wx.revokeBufferURL	根据 URL 销毁存在内存中的数据
wx.removeStorageSync	wx.removeStorage 的同步版本
wx.removeStorage	从本地缓存中移除指定 key
wx.getStorageSync	从本地缓存中同步获取指定 key 的内容
wx.getStorageInfoSync	wx.getStorageInfo 的同步版本
wx.getStorageInfo	异步获取当前storage的相关信息
wx.getStorage	从本地缓存中异步获取指定 key 的内容
wx.createBufferURL	根据传入的 buffer 创建一个唯一的 URL 存在内存中
wx.clearStorageSync	wx.clearStorage 的同步版本
wx.clearStorage	清理本地数据缓存
数据预拉取和周期性更新	
名称	功能
wx.setBackgroundFetchToken	设置自定义登录态，在周期性拉取数据时带上，便于第三方服务器验证请求合法性
wx.onBackgroundFetchData	监听收到 backgroundFetch 数据事件
wx.getBackgroundFetchToken	获取设置过的自定义登录态
wx.getBackgroundFetchData	拉取 backgroundFetch 客户端缓存数据

数据分析
名称	功能
wx.reportUserBehaviorBranchAnalytics	上报场景分析，用于UI组件（一般是按钮）相关事件的上报，事件目前有曝光、点击两种，查看相关文档
wx.reportScene	用于游戏启动阶段的自定义场景上报
wx.reportMonitor	自定义业务数据监控上报接口
wx.reportEvent	事件上报
wx.getMiniReportManager	初始化并返回一个MiniReportManager实例，用于记录和管理小游戏上报
wx.getGameLogManager	初始化并返回一个游戏日志管理器实例，用于记录和管理游戏日志
wx.getGameExptInfo	给定实验参数数组，获取对应的实验参数值
wx.getExptInfoSync	给定实验参数数组，获取对应的实验参数值
GameLogManager	GameLogManager 类用于管理小游戏日志
名称	功能
GameLogManager.getCommonInfo	读取当前 logger 的全局 commonInfo 对象
GameLogManager.log	上报日志
GameLogManager.tag	tag 方法接受一个字符串参数，作为上报日志的 key
GameLogManager.updateCommonInfo	该方法接受一个对象，并将其与当前logger的全局 commonInfo 对象进行合并
MiniReportManager	MiniReportManager 类用于管理小游戏日志
名称	功能
MiniReportManager.report	上报关卡日志

渲染
名称	功能
画布	
名称	功能
wx.createPath2D	创建一个 Path2D 路径对象
wx.createCanvas	创建一个画布对象
Canvas	画布对象
名称	功能
Canvas.getContext	获取画布对象的绘图上下文
Canvas.toDataURL	把画布上的绘制内容以一个 data URI 的格式返回
Canvas.toTempFilePath	将当前 Canvas 保存为一个临时文件
Canvas.toTempFilePathSync	Canvas.toTempFilePath 的同步版本
Path2D	Canvas 2D API 的接口 Path2D 用来声明路径，此路径稍后会被 CanvasRenderingContext2D 对象使用
RenderingContext	画布对象的绘图上下文
WebGLRenderingContext.wxBindCanvasTexture	将一个 Canvas 对应的 Texture 绑定到 WebGL 上下文
帧率	
名称	功能
wx.setPreferredFramesPerSecond	可以修改渲染帧率
cancelAnimationFrame	取消由 requestAnimationFrame 添加到计划中的动画帧请求
requestAnimationFrame	在下次进行重绘时执行
字体	
名称	功能
wx.loadFont	加载自定义字体文件
wx.getTextLineHeight	获取一行文本的行高
图片	
名称	功能
wx.createImageData	这里有两种使用方法, 一种是指定ImageData的宽和高, 另外一种是使用ImageData, 通过它本身的宽高尺寸来构建新的对象
wx.createImage	创建一个图片对象
Image	图片对象
ImageData	ImageData 对象
鼠标样式	
名称	功能
wx.setCursor	加载自定义光标，仅支持 PC 平台
wx.requestPointerLock	锁定鼠标指针
wx.isPointerLocked	检查鼠标指针是否被锁定
wx.exitPointerLock	解除锁定鼠标指针

媒体
名称	功能
音频	
名称	功能
wx.setInnerAudioOption	设置 InnerAudioContext 的播放选项
wx.getAvailableAudioSources	获取当前支持的音频输入源
wx.createWebAudioContext	创建 WebAudio 上下文
wx.createMediaAudioPlayer	创建媒体音频播放器对象 MediaAudioPlayer 对象，可用于播放视频解码器 VideoDecoder 输出的音频
wx.createInnerAudioContext	创建内部 audio 上下文 InnerAudioContext 对象
AudioBuffer	AudioBuffer接口表示存在内存里的一段短小的音频资源，利用WebAudioContext.decodeAudioData方法从一个音频文件构建，或者利用 WebAudioContext.createBuffer从原始数据构建
名称	功能
AudioBuffer.copyFromChannel	从AudioBuffer的指定频道复制到数组终端
AudioBuffer.copyToChannel	从指定数组复制样本到audioBuffer的特定通道
AudioBuffer.getChannelData	返回一个 Float32Array，包含了带有频道的PCM数据，由频道参数定义（有0代表第一个频道）
AudioListener	空间音频监听器，代表在一个音频场景内唯一的位置和方向信息
AudioParam	AudioParam 接口代表音频相关的参数，通常是 AudioNode（例如 GainNode.gain）的参数
BufferSourceNode	音频源节点，通过 WebAudioContext.createBufferSource方法获得
名称	功能
BufferSourceNode.connect	连接到一个指定目标
BufferSourceNode.disconnect	与已连接的目标节点断开连接
BufferSourceNode.start	音频源开始播放
BufferSourceNode.stop	停止播放
InnerAudioContext	InnerAudioContext 实例，可通过 wx.createInnerAudioContext 接口获取实例
名称	功能
InnerAudioContext.destroy	销毁当前实例
InnerAudioContext.offCanplay	移除音频进入可以播放状态的事件的监听函数
InnerAudioContext.offEnded	移除音频自然播放至结束的事件的监听函数
InnerAudioContext.offError	移除音频播放错误事件的监听函数
InnerAudioContext.offPause	移除音频暂停事件的监听函数
InnerAudioContext.offPlay	移除音频播放事件的监听函数
InnerAudioContext.offSeeked	移除音频完成跳转操作的事件的监听函数
InnerAudioContext.offSeeking	移除音频进行跳转操作的事件的监听函数
InnerAudioContext.offStop	移除音频停止事件的监听函数
InnerAudioContext.offTimeUpdate	移除音频播放进度更新事件的监听函数
InnerAudioContext.offWaiting	移除音频加载中事件的监听函数
InnerAudioContext.onCanplay	监听音频进入可以播放状态的事件
InnerAudioContext.onEnded	监听音频自然播放至结束的事件
InnerAudioContext.onError	监听音频播放错误事件
InnerAudioContext.onPause	监听音频暂停事件
InnerAudioContext.onPlay	监听音频播放事件
InnerAudioContext.onSeeked	监听音频完成跳转操作的事件
InnerAudioContext.onSeeking	监听音频进行跳转操作的事件
InnerAudioContext.onStop	监听音频停止事件
InnerAudioContext.onTimeUpdate	监听音频播放进度更新事件
InnerAudioContext.onWaiting	监听音频加载中事件
InnerAudioContext.pause	暂停
InnerAudioContext.play	播放
InnerAudioContext.seek	跳转到指定位置
InnerAudioContext.stop	停止
MediaAudioPlayer	MediaAudioPlayer 实例，可通过 wx.createMediaAudioPlayer 接口获取实例
名称	功能
MediaAudioPlayer.addAudioSource	添加音频源
MediaAudioPlayer.destroy	销毁播放器
MediaAudioPlayer.removeAudioSource	移除音频源
MediaAudioPlayer.start	启动播放器
MediaAudioPlayer.stop	停止播放器
WebAudioContext	WebAudioContext 实例，通过wx.createWebAudioContext 接口获取该实例
名称	功能
WebAudioContext.close	关闭WebAudioContext
WebAudioContext.createAnalyser	创建一个 AnalyserNode
WebAudioContext.createBiquadFilter	创建一个BiquadFilterNode
WebAudioContext.createBuffer	创建一个AudioBuffer，代表着一段驻留在内存中的短音频
WebAudioContext.createBufferSource	创建一个BufferSourceNode实例，通过AudioBuffer对象来播放音频数据
WebAudioContext.createChannelMerger	创建一个ChannelMergerNode
WebAudioContext.createChannelSplitter	创建一个ChannelSplitterNode
WebAudioContext.createConstantSource	创建一个ConstantSourceNode
WebAudioContext.createDelay	创建一个DelayNode
WebAudioContext.createDynamicsCompressor	创建一个DynamicsCompressorNode
WebAudioContext.createGain	创建一个GainNode
WebAudioContext.createIIRFilter	创建一个IIRFilterNode
WebAudioContext.createOscillator	创建一个OscillatorNode
WebAudioContext.createPanner	创建一个PannerNode
WebAudioContext.createPeriodicWave	创建一个PeriodicWaveNode
WebAudioContext.createScriptProcessor	创建一个ScriptProcessorNode
WebAudioContext.createWaveShaper	创建一个WaveShaperNode
WebAudioContext.decodeAudioData	异步解码一段资源为AudioBuffer
WebAudioContext.resume	同步恢复已经被暂停的WebAudioContext上下文
WebAudioContext.suspend	同步暂停WebAudioContext上下文
WebAudioContextNode	一类音频处理模块，不同的Node具备不同的功能，如GainNode(音量调整)等
图片	
名称	功能
wx.saveImageToPhotosAlbum	保存图片到系统相册
wx.previewMedia	预览图片和视频
wx.previewImage	在新页面中全屏预览图片
wx.compressImage	压缩图片接口，可选压缩质量
wx.chooseMessageFile	从客户端会话选择文件
wx.chooseImage	从本地相册选择图片或使用相机拍照
录音	
名称	功能
wx.getRecorderManager	获取全局唯一的录音管理器 RecorderManager
RecorderManager	全局唯一的录音管理器
名称	功能
RecorderManager.onError	监听录音错误事件
RecorderManager.onFrameRecorded	监听已录制完指定帧大小的文件事件
RecorderManager.onInterruptionBegin	监听录音因为受到系统占用而被中断开始事件
RecorderManager.onInterruptionEnd	监听录音中断结束事件
RecorderManager.onPause	监听录音暂停事件
RecorderManager.onResume	监听录音继续事件
RecorderManager.onStart	监听录音开始事件
RecorderManager.onStop	监听录音结束事件
RecorderManager.pause	暂停录音
RecorderManager.resume	继续录音
RecorderManager.start	开始录音
RecorderManager.stop	停止录音
视频	
名称	功能
wx.createVideo	创建视频
wx.chooseMedia	拍摄或从手机相册中选择图片或视频
Video	视频对象
名称	功能
Video.destroy	销毁视频
Video.exitFullScreen	视频退出全屏
Video.offEnded	移除视频播放到末尾事件的监听函数
Video.offError	移除视频错误事件的监听函数
Video.offPause	移除视频暂停事件的监听函数
Video.offPlay	移除视频播放事件的监听函数
Video.offProgress	移除视频下载（缓冲）事件的监听函数
Video.offTimeUpdate	移除视频播放进度更新事件的监听函数
Video.offWaiting	移除视频由于需要缓冲下一帧而停止时触发的监听函数
Video.onEnded	监听视频播放到末尾事件
Video.onError	监听视频错误事件
Video.onPause	监听视频暂停事件
Video.onPlay	监听视频播放事件
Video.onProgress	监听视频下载（缓冲）事件
Video.onTimeUpdate	监听视频播放进度更新事件
Video.onWaiting	监听视频由于需要缓冲下一帧而停止时触发
Video.pause	暂停视频
Video.play	播放视频
Video.requestFullScreen	视频全屏
Video.seek	视频跳转
Video.stop	停止视频
相机	
名称	功能
wx.createCamera	创建相机
Camera	相机对象
名称	功能
Camera.closeFrameChange	关闭监听帧数据
Camera.destroy	销毁相机
Camera.listenFrameChange	开启监听帧数据
Camera.onAuthCancel	监听用户不允许授权使用摄像头的情况
Camera.onCameraFrame	监听摄像头实时帧数据
Camera.onStop	监听摄像头非正常终止事件，如退出后台等情况
Camera.startRecord	开始录像
Camera.stopRecord	结束录像，成功则返回封面与视频
Camera.takePhoto	拍照，可指定质量，成功则返回图片
视频解码器	
名称	功能
wx.createVideoDecoder	创建视频解码器，可逐帧获取解码后的数据
VideoDecoder	可通过 wx.createVideoDecoder 创建
名称	功能
VideoDecoder.getFrameData	获取下一帧的解码数据
VideoDecoder.off	取消监听录制事件
VideoDecoder.on	注册监听录制事件的回调函数
VideoDecoder.remove	移除解码器
VideoDecoder.seek	跳到某个时间点解码
VideoDecoder.start	开始解码
VideoDecoder.stop	停止解码
实时语音	
名称	功能
wx.updateVoIPChatMuteConfig	更新实时语音静音设置
wx.onVoIPChatStateChanged	监听房间状态变化事件
wx.onVoIPChatSpeakersChanged	监听实时语音通话成员通话状态变化事件
wx.onVoIPChatMembersChanged	监听实时语音通话成员在线状态变化事件
wx.onVoIPChatInterrupted	监听被动断开实时语音通话事件
wx.offVoIPChatStateChanged	移除房间状态变化事件的监听函数
wx.offVoIPChatSpeakersChanged	移除实时语音通话成员通话状态变化事件的监听函数
wx.offVoIPChatMembersChanged	移除实时语音通话成员在线状态变化事件的监听函数
wx.offVoIPChatInterrupted	移除被动断开实时语音通话事件的监听函数
wx.joinVoIPChat	加入 (创建) 实时语音通话，更多信息可见 实时语音指南
wx.exitVoIPChat	退出（销毁）实时语音通话

位置
名称	功能
wx.getLocation	获取当前的地理位置、速度
wx.getFuzzyLocation	获取当前的模糊地理位置

文件
名称	功能
wx.saveFileToDisk	保存文件系统的文件到用户磁盘，仅在 PC 端支持
wx.getFileSystemManager	获取全局唯一的文件管理器
FileStats	每个 FileStats 对象包含 path 和 Stats
FileSystemManager	文件管理器，可通过 wx.getFileSystemManager 获取
名称	功能
FileSystemManager.access	判断文件/目录是否存在
FileSystemManager.accessSync	FileSystemManager.access 的同步版本
FileSystemManager.appendFile	在文件结尾追加内容
FileSystemManager.appendFileSync	FileSystemManager.appendFile 的同步版本
FileSystemManager.close	关闭文件
FileSystemManager.closeSync	同步关闭文件
FileSystemManager.copyFile	复制文件
FileSystemManager.copyFileSync	FileSystemManager.copyFile 的同步版本
FileSystemManager.fstat	获取文件的状态信息
FileSystemManager.fstatSync	同步获取文件的状态信息
FileSystemManager.ftruncate	对文件内容进行截断操作
FileSystemManager.ftruncateSync	对文件内容进行截断操作
FileSystemManager.getFileInfo	获取该小程序下的 本地临时文件 或 本地缓存文件 信息
FileSystemManager.getSavedFileList	获取该小程序下已保存的本地缓存文件列表
FileSystemManager.mkdir	创建目录
FileSystemManager.mkdirSync	FileSystemManager.mkdir 的同步版本
FileSystemManager.open	打开文件，返回文件描述符
FileSystemManager.openSync	同步打开文件，返回文件描述符
FileSystemManager.read	读文件
FileSystemManager.readCompressedFile	读取指定压缩类型的本地文件内容
FileSystemManager.readCompressedFileSync	同步读取指定压缩类型的本地文件内容
FileSystemManager.readdir	读取目录内文件列表
FileSystemManager.readdirSync	FileSystemManager.readdir 的同步版本
FileSystemManager.readFile	读取本地文件内容
FileSystemManager.readFileSync	FileSystemManager.readFile 的同步版本
FileSystemManager.readSync	读文件
FileSystemManager.readZipEntry	读取压缩包内的文件
FileSystemManager.removeSavedFile	删除该小程序下已保存的本地缓存文件
FileSystemManager.rename	重命名文件
FileSystemManager.renameSync	FileSystemManager.rename 的同步版本
FileSystemManager.rmdir	删除目录
FileSystemManager.rmdirSync	FileSystemManager.rmdir 的同步版本
FileSystemManager.saveFile	保存临时文件到本地
FileSystemManager.saveFileSync	FileSystemManager.saveFile 的同步版本
FileSystemManager.stat	获取文件 Stats 对象
FileSystemManager.statSync	FileSystemManager.stat 的同步版本
FileSystemManager.truncate	对文件内容进行截断操作
FileSystemManager.truncateSync	对文件内容进行截断操作 (truncate 的同步版本)
FileSystemManager.unlink	删除文件
FileSystemManager.unlinkSync	FileSystemManager.unlink 的同步版本
FileSystemManager.unzip	解压文件
FileSystemManager.write	写入文件
FileSystemManager.writeFile	写文件
FileSystemManager.writeFileSync	FileSystemManager.writeFile 的同步版本
FileSystemManager.writeSync	同步写入文件
ReadResult	文件读取结果
Stats	描述文件状态的对象
名称	功能
Stats.isDirectory	判断当前文件是否一个目录
Stats.isFile	判断当前文件是否一个普通文件
WriteResult	文件写入结果

开放接口
名称	功能
用户信息	
名称	功能
wx.getUserInfo	获取用户信息
wx.getPhoneNumber	手机号快速验证，向用户申请，并在用户同意后，快速填写和验证手机 具体说明
wx.createUserInfoButton	创建用户信息按钮
UserInfoButton	用户信息按钮
名称	功能
UserInfoButton.destroy	销毁用户信息按钮
UserInfoButton.hide	隐藏用户信息按钮
UserInfoButton.offTap	移除用户信息按钮的点击事件的监听函数
UserInfoButton.onTap	监听用户信息按钮的点击事件
UserInfoButton.show	显示用户信息按钮
登录	
名称	功能
wx.login	调用接口获取登录凭证（code）
wx.checkSession	检查登录态 session_key 是否过期
授权	
名称	功能
wx.authorize	提前向用户发起授权请求
开放数据	
名称	功能
wx.shareMessageToFriend	给指定的好友分享游戏信息，该接口只可在开放数据域下使用
wx.setUserCloudStorage	对用户托管数据进行写数据操作
wx.removeUserCloudStorage	删除用户托管数据当中对应 key 的数据
wx.onInteractiveStorageModified	监听成功修改好友的互动型托管数据事件，该接口在游戏主域使用
wx.offInteractiveStorageModified	取消监听成功修改好友的互动型托管数据事件，该接口在游戏主域使用
wx.modifyFriendInteractiveStorage	修改好友的互动型托管数据，该接口只可在开放数据域下使用
wx.getUserInteractiveStorage	获取当前用户互动型托管数据对应 key 的数据
wx.getUserCloudStorageKeys	获取当前用户托管数据当中所有的 key
wx.getUserCloudStorage	获取当前用户托管数据当中对应 key 的数据
wx.getSharedCanvas	获取主域和开放数据域共享的 sharedCanvas
wx.getPotentialFriendList	获取可能对游戏感兴趣的未注册的好友名单
wx.getGroupMembersInfo	获取所选群成员的头像、昵称，自行在开放数据域中渲染
wx.getGroupInfo	获取群信息
wx.getGroupCloudStorage	获取群同玩成员的游戏数据
wx.getFriendCloudStorage	拉取当前用户所有同玩好友的托管数据
FriendInfo	用户信息
KVData	托管的 KV 数据
UserGameData	托管数据
UserInfo	用户信息
OpenDataContext-wx.getUserInfo	批量获取用户信息，仅支持获取自己和好友的用户信息
开放数据域	
名称	功能
wx.onMessage	监听主域发送的消息
wx.getOpenDataContext	获取开放数据域
OpenDataContext	开放数据域对象
名称	功能
OpenDataContext.postMessage	向开放数据域发送消息
防沉迷	
意见反馈	
名称	功能
wx.createFeedbackButton	创建打开意见反馈页面的按钮
FeedbackButton	用户点击后打开意见反馈页面的按钮
名称	功能
FeedbackButton.destroy	销毁意见反馈按钮
FeedbackButton.hide	隐藏意见反馈按钮
FeedbackButton.offTap	移除意见反馈按钮的点击事件的监听函数
FeedbackButton.onTap	监听意见反馈按钮的点击事件
FeedbackButton.show	显示意见反馈按钮
设置	
名称	功能
wx.openSetting	调起客户端小程序设置界面，返回用户设置的操作结果
wx.getSetting	获取用户的当前设置
wx.createOpenSettingButton	创建打开设置页面的按钮
AuthSetting	用户授权设置信息，详情参考权限
OpenSettingButton	用户点击后打开设置页面的按钮
名称	功能
OpenSettingButton.destroy	销毁打开设置页面按钮
OpenSettingButton.hide	隐藏打开设置页面按钮
OpenSettingButton.offTap	移除设置页面按钮的点击事件的监听函数
OpenSettingButton.onTap	监听设置页面按钮的点击事件
OpenSettingButton.show	显示打开设置页面按钮
SubscriptionsSetting	订阅消息设置
游戏圈	
名称	功能
wx.getGameClubData	获取游戏圈数据
wx.createGameClubButton	创建游戏圈按钮
GameClubButton	游戏圈按钮
名称	功能
GameClubButton.destroy	销毁游戏圈按钮
GameClubButton.hide	隐藏游戏圈按钮
GameClubButton.offTap	移除游戏圈按钮的点击事件的监听函数
GameClubButton.onTap	监听游戏圈按钮的点击事件
GameClubButton.show	显示游戏圈按钮
客服消息	
名称	功能
wx.openCustomerServiceConversation	进入客服会话
微信运动	
名称	功能
wx.getWeRunData	获取用户过去三十一天微信运动步数
OPENLINK	
名称	功能
wx.createPageManager	小游戏开放页面管理器，用于启动微信内置的各种小游戏活动、功能页面
PageManager	小游戏开放页面管理器实例
名称	功能
PageManager.destroy	销毁开放页面实例
PageManager.load	提供OPENLINK加载活动、功能信息
PageManager.off	取消监听来自活动、功能向开发者产生的某些事件
PageManager.on	监听来自活动、功能向开发者产生的某些事件
PageManager.show	显示已经成功加载信息的开放页面活动、功能
微信小店	
名称	功能
wx.createStoreGift	创建蓝包组件
StoreGift	可通过 wx.createStoreGift 创建
名称	功能
StoreGift.getOrderInfo	查询订单状态
StoreGift.isSupported	获取当前环境是否支持礼物组件
StoreGift.open	打开礼物，请注意，这里的回调仅仅是打开礼物界面的回调，并不是收下礼物的回调
卡券	
名称	功能
wx.openCard	查看微信卡包中的卡券
wx.addCard	批量添加卡券
我的小程序	
名称	功能
wx.checkIsAddedToMyMiniProgram	检查小程序是否被添加至 「我的小程序」
账号信息	
名称	功能
wx.getAccountInfoSync	获取当前账号信息
视频号	
名称	功能
wx.reserveChannelsLive	预约视频号直播
wx.openChannelsUserProfile	打开视频号主页
wx.openChannelsLive	打开视频号直播
wx.openChannelsEvent	打开视频号活动页
wx.openChannelsActivity	打开视频号视频
wx.getChannelsLiveNoticeInfo	获取视频号直播预告信息
wx.getChannelsLiveInfo	获取视频号直播信息
微信群	
名称	功能
wx.getGroupEnterInfo	获取微信群聊场景下的小程序启动信息
隐私信息授权	
名称	功能
wx.requirePrivacyAuthorize	模拟隐私接口调用，并触发隐私弹窗逻辑
wx.openPrivacyContract	跳转至隐私协议页面
wx.onNeedPrivacyAuthorization	监听隐私接口需要用户授权事件
wx.getPrivacySetting	查询隐私授权情况
微信客服	
名称	功能
wx.openCustomerServiceChat	打开微信客服，页面产生点击事件后才可调用
订阅消息	
名称	功能
wx.requestSubscribeSystemMessage	调起小游戏系统订阅消息界面，返回用户订阅消息的操作结果
wx.requestSubscribeMessage	调起客户端小游戏订阅消息界面，返回用户订阅消息的操作结果

设备
名称	功能
键盘	
名称	功能
wx.updateKeyboard	更新键盘输入框内容
wx.showKeyboard	显示键盘
wx.onKeyUp	监听键盘按键弹起事件，仅适用于 PC 平台
wx.onKeyDown	监听键盘按键按下事件，仅适用于 PC 平台
wx.onKeyboardInput	监听键盘输入事件
wx.onKeyboardHeightChange	监听键盘高度变化事件
wx.onKeyboardConfirm	监听用户点击键盘 Confirm 按钮时的事件
wx.onKeyboardComplete	监听键盘收起的事件
wx.offKeyUp	移除键盘按键弹起事件的监听函数
wx.offKeyDown	移除键盘按键按下事件的监听函数
wx.offKeyboardInput	移除键盘输入事件的监听函数
wx.offKeyboardHeightChange	移除键盘高度变化事件的监听函数
wx.offKeyboardConfirm	移除用户点击键盘 Confirm 按钮时的事件的监听函数
wx.offKeyboardComplete	移除键盘收起的事件的监听函数
wx.hideKeyboard	隐藏键盘
触摸	
名称	功能
wx.onTouchStart	监听开始触摸事件
wx.onTouchMove	监听触点移动事件
wx.onTouchEnd	监听触摸结束事件
wx.onTouchCancel	监听触点失效事件
wx.offTouchStart	移除开始触摸事件的监听函数
wx.offTouchMove	移除触点移动事件的监听函数
wx.offTouchEnd	移除触摸结束事件的监听函数
wx.offTouchCancel	移除触点失效事件的监听函数
Touch	在触控设备上的触摸点