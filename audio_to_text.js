const fs = require('fs')
const WaveFile = require('wavefile').WaveFile;
const wav = require("wav");
var vosk = require('vosk')
const {Readable} = require("stream");
MODEL_PATH = "model"
var FFmpeg = require('fluent-ffmpeg');


FILE_NAME = "sanj.wav"

if (!fs.existsSync(MODEL_PATH)) {
    console.log("Please download the model from https://alphacephei.com/vosk/models and unpack as " + MODEL_PATH + " in the current folder.")
    process.exit()
}

if (process.argv.length > 2)
    FILE_NAME = process.argv[2]
if (getNumChannels(FILE_NAME) === 2) {
    const command = FFmpeg({
            source: FILE_NAME
        }).addOption('-ac', 1)
            .saveToFile('mono-' + FILE_NAME)
            .on('end', function () {
                console.log('Conversion finished');
                console.log('Final channel: ', getNumChannels(FILE_NAME))
            })
            .run()
    ;
    FILE_NAME = 'mono-' + FILE_NAME

}


vosk.setLogLevel(0);
const model = new vosk.Model(MODEL_PATH);

const wfReader = new wav.Reader();
const wfReadable = new Readable().wrap(wfReader);

wfReader.on('format', async ({ audioFormat, sampleRate, channels }) => {
    console.log('Channel: ', channels)
    if (audioFormat != 1 || channels != 1) {
        console.error("Audio file must be WAV format mono PCM.");
        process.exit(1);
    }
    const rec = new vosk.Recognizer({model: model, sampleRate: sampleRate});
    rec.setMaxAlternatives(10);
    rec.setWords(true);
    rec.setPartialWords(true);
    for await (const data of wfReadable) {
        const end_of_speech = rec.acceptWaveform(data);
        if (end_of_speech) {
            console.log(JSON.stringify(rec.result(), null, 4));
        } else {
            console.log(JSON.stringify(rec.partialResult(), null, 4));
        }
    }
    console.log(JSON.stringify(rec.finalResult(rec), null, 4));
    rec.free();
});

fs.createReadStream(FILE_NAME, {'highWaterMark': 4096}).pipe(wfReader).on('finish',
    function (err) {
        model.free();
    });

function getNumChannels(filePath) {
    // Read the .wav file
    const buffer = fs.readFileSync(filePath);

    // Parse the .wav file
    const wav = new WaveFile()
    wav.fromBuffer(buffer)
    // const waveFile = new WaveFile(buffer);

    // Return the number of channels
    return wav.fmt.numChannels;
}