importScripts('ffmpeg.js');
// importScripts(window.location.origin + '/static2/ffmpeg.js');
// importScripts(window.location.origin + '/static2/ffmpeg.js');

function print(text) {
  postMessage({
    'type': 'stdout',
    'data': text
  });
}

function printErr(text) {
  postMessage({
    'type': 'stderr',
    'data': text
  });
}

self.addEventListener('message',  (event) => {
  let message = event.data;
  if (message.type === "ffmpeg") {
    let Module = {
      print: print,
      printErr: printErr,
      files: message.files,
      arguments: message.arguments
    };

    let result = ffmpeg_run(Module);

    let code = result.code;
    let outFileNames = Object.keys(result.outputFiles);
    if (code == 0 && outFileNames.length) {//成功返回文件
      let outFileName = outFileNames[0];
      let outFilebuffer = result.outputFiles[outFileName];
      // console.log(outFilebuffer)
      postMessage({
        'type': 'outfile',//输出文件
        'index': message.index,
        'name': outFileName,
        'buffer': outFilebuffer
      });
    }
  }
}, false);

// ffmpeg loaded
postMessage({
  'type': 'ready'
});
