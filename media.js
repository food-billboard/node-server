const NodeMediaServer = require('node-media-server');
 
const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    allow_origin: '*',
    mediaroot: './static',
  },
  trans: {
    ffmpeg: '/usr/local/opt/ffmpeg/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
        dash: true,
        dashFlags: '[f=dash:window_size=3:extra_window_size=5]',
        ac: 'copy',
      }
    ]
  },
  //引入中继模式任务
  // relay: {
  //   //指定ffmpeg可执行文件位置
  //   ffmpeg: '/usr/local/opt/ffmpeg/bin/ffmpeg',
  //   tasks: [
  //     {
  //       //应用名称
  //       app: 'live',
  //       hls: true,
  //       hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
  //       dash: true,
  //       dashFlags: '[f=dash:window_size=3:extra_window_size=5]',
  //       ac: 'copy',
  //       // //工作模式 静态即可
  //       // mode: 'static',
  //       // //中继地址
  //       // edge: 'rtsp://184.72.239.149/vod/mp4:BigBuckBunny_175k.mov',
  //       // //访问资源名称
  //       // name: 'rtsp',
  //       // //传输协议
  //       // rtsp_transport : 'tcp' //['udp', 'tcp', 'udp_multicast', 'http']
  //     }
  //   ]
  // },
};
 
var nms = new NodeMediaServer(config)
nms.run()