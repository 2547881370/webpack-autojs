"ui";

// 修改启动和停止功能
let isRunning = false;
let thread = null;
let img = null;

// 封装文字识别方法
function recognizeText(img) {
    let res = paddle.ocr(img,4,false);
    return res;
}

// 封装查找目标文字方法,使用正则表达式
function findTargetText(recognizedText, targetRegexes) {
    return recognizedText.some(item => {
        console.log(item.text)
        return targetRegexes.some(regex => regex.test(item.text))
    });
}

// 封装弹框方法
function showConfirmDialog(content) {
    return new Promise((resolve) => {
        dialogs.build({
            title: "提醒",
            content: content,
            positive: "确定",
            negative: "取消"
        }).on("positive", () => {
            resolve(true);
        }).on("negative", () => {
            resolve(false);
        }).show();
    });
}

// 修改主要工作流程
async function main() {
        //安卓版本高于Android 9
    if(device.sdkInt>28){
        //等待截屏权限申请并同意
        threads.start(function () {
            packageName('com.android.systemui').text('立即开始').waitFor();
            text('立即开始').click();
        });
    }
    //申请截屏权限
    if (!requestScreenCapture()) {
        toast("请求截图失败");
        exit()
    }
    // console.show(true);
    // console.log('开始识别')
    let targetRegexes = [
        /您有一笔充值订单/,
        /充值订单/,
        /请确认/,
        /提示/,
    ];
    
    while (isRunning) {  // 添加 isRunning 检查
        // 截图
        img = captureScreen();
        
        // 识别文字
        let recognizedText = recognizeText(img);
        
        // 使用正则表达式查找目标文字
        if (findTargetText(recognizedText, targetRegexes)) {
            toastLog("找到目标");
            
            // 显示弹框
            let confirmed = await showConfirmDialog("您有一笔充值订单，是否继续识别？");
            
            if (!confirmed) {
                toastLog("用户选择退出");
                stopRecognition();  // 调用 stopRecognition 而不是 break
                break;
            }
        } else {
            toastLog("未找到目标,继续识别");
        }
        
        // 等待1秒
        await sleep(1000);
    }
}

// 辅助函数：睡眠
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function startRecognition() {
    if (!isRunning) {
        isRunning = true;
        thread = threads.start(function() {
            main().catch(err => {
                console.error("程序出错 ：", err);
                isRunning = false;  // 确保出错时也会停止运行
            });
        });
        toastLog("识别已启动");
    } else {
        toastLog("识别已在运行中");
    }
}

function stopRecognition() {
    if (isRunning) {
        isRunning = false;
        if (thread) {
            thread.interrupt();
            thread = null;
        }
        toastLog("识别已停止");
    } else {
        toastLog("识别未在运行");
    }
}

ui.layout(
    <vertical padding="16" id="parent">
        <horizontal>
            <button id="startBtn" text="启动识别" w="*" h="40" bg="#4CAF50" />
        </horizontal>
        <horizontal>
            <button id="stopBtn" text="停止识别" w="*" h="40" bg="#F44336" />
        </horizontal>
    </vertical>
);
ui.startBtn.click(function () {
    startRecognition();

});
ui.stopBtn.click(function () {
    stopRecognition();
});
setInterval(
    function () {
    }, 1000
)
