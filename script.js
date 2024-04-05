const ffmpeg = require('fluent-ffmpeg');
const path=require("path")
const fs = require('fs');
const speech = require('@google-cloud/speech');
const ffmpegPath=require('@ffmpeg-installer/ffmpeg').path
const voskClient=require('vosk')

ffmpeg.setFfmpegPath(ffmpegPath)
voskClient.setLogLevel(0)
const model_path="model"
if(!fs.existsSync(model_path)){
        console.log("Please download the model from https://alphacephei.com/vosk/models and unpack as " + model_path + " in the current folder.")
        process.exit()
    }
   
const model=new voskClient.Model(model_path)
const reco=new voskClient.Recognizer({model:model,sampleRate:16000.0})

async function transcribeAudioToText(audioFilePath){
    reco.setMaxAlternatives(10);
    reco.setWords(true);
    reco.setPartialWords(true);
    fs.readFile(audioFilePath,(err,data)=>{
        console.log(audioFilePath)
        if(err){
            return console.log(err)
        }
       const end_of_speech=reco.acceptWaveform(data)
       if(end_of_speech){
        console.log(JSON.stringify(reco.result(), null, 4));
       }
       console.log(JSON.stringify(reco.finalResult(reco), null, 4));
    })
    // reco.free()
//     const audiouPath=audioFilePath
//     const audio={
//         uri:audiouPath
//     }
//     const config={
//         encoding: 'LINEAR16',
//     sampleRateHertz: 16000,
//     languageCode: 'en-US',
//     }
//     const request={
//         audio:audio,
//         config:config
//     }
//     const[response]=await client.recognize(request)
//     const transcription = response.results
//     .map(result => result.alternatives[0].transcript)
//     .join('\n');
//   console.log(`Transcription: ${transcription}`);

}

function transcribeLocalVideo(filePath,formatTo) {
    const fileName = path.basename(filePath);
    var outputPath = path.join(__dirname, fileName.replace(/\.[^/.]+$/, `.${formatTo}`)); 
    
    let i = 1;
    while (fs.existsSync(outputPath)) {
        outputPath = path.join(__dirname, fileName.replace(/\.[^/.]+$/, `_${i}.${formatTo}`)); 
        i++;
    }
    ffmpeg(filePath)
        .outputOptions('-vn', '-ab', '128k', '-ar', '44100')
        .toFormat('wav')
        .save(outputPath)
        .on('progress', (progress) => {
          console.log(`\n CONVERTED FILE SIZE:${progress.targetSize}\n CONVERTING RATE: ${progress.currentKbps} \n`)   
          })
        .on('error', (err) => console.error(`Error converting file: ${err}`))
        .on('start',()=>console.log('\n PLEASE WAIT YOUR FILE IS CONVERTING \n'))
        .on('end', () => {console.log(`\n 
        ------------------------------------------
        | YOUR FILE IS SUCCESSFULLY CONVERTED :) |
        ------------------------------------------ \n `)
          transcribeAudioToText(outputPath)
    });
  

}
if (process.argv.length < 3) {
    console.error('Usage: node script.js <filename>');
    process.exit(1);
}


const filePath = process.argv[2];
const formatTo=process.argv[3]



transcribeLocalVideo(filePath,formatTo);