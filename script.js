const ffmpeg = require('fluent-ffmpeg');
const path=require("path")
const fs = require('fs');
const speech = require('@google-cloud/speech');
const ffmpegPath=require('@ffmpeg-installer/ffmpeg').path

ffmpeg.setFfmpegPath(ffmpegPath)

function transcribeLocalVideo(filePath) {
    const fileName = path.basename(filePath);
    var outputPath = path.join(__dirname, fileName.replace(/\.[^/.]+$/, ".mp3")); 
    console.log(outputPath,'path')
    let i = 1;
    while (fs.existsSync(outputPath)) {
        outputPath = path.join(__dirname, fileName.replace(/\.[^/.]+$/, `_${i}.mp3`)); 
        i++;
    }
    ffmpeg(filePath)
        .outputOptions('-vn', '-ab', '128k', '-ar', '44100')
        .toFormat('mp3')
        .save(outputPath)
        .on('error', (err) => console.error(`Error converting file: ${err}`))
        .on('start',()=>console.log('\n PLEASE WAIT YOUR FILE IS CONVERTING \n'))
        .on('end', () => console.log(` YOUR FILE IS SUCCESSFULLY CONVERTED :) \n`));
}
if (process.argv.length < 3) {
    console.error('Usage: node script.js <filename>');
    process.exit(1);
}


const filePath = process.argv[2];



transcribeLocalVideo(filePath);