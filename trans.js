const fs = require('fs');
const path = require('path');
const fsAsync = fs.promises;
const { parser } = require('stream-json');
const base = __dirname;
const rootPath = path.join(base, 'public/locales');
const inLocale = 'en';
const outLocale = 'vi';

main();

async function main() {
  const rawFiles = await getItems({ curDic: path.join(rootPath, inLocale), isFolder: false });
  await Promise.all(rawFiles.map(async (file) => genFile(file)));
}

async function genFile(file) {
  const { Translate } = await import('translate');
  const translate = Translate({ engine: 'google', from: 'en' });
  const oldData = await getRaw({ dir: path.join(rootPath, inLocale), file });

  const translatedData = await translateEntries(oldData, translate);
  const writer = createWriter({ dir: path.join(rootPath, outLocale), fileName: file });
  writer({ data: JSON.stringify(translatedData), isEnd: true });
}

async function translateEntries(data, translate) {
  const translatedEntries = await Promise.all(
    Object.entries(data).map(async ([key, value]) => {
      const translatedValue = await translate(value, { to: outLocale });
      return [key, translatedValue];
    })
  );
  return Object.fromEntries(translatedEntries);
}

async function getRaw({ dir, file }) {
  return new Promise((resolve, reject) => {
    const res = {};
    let isKey = true;
    let curKey;
    const readStream = fs.createReadStream(path.join(dir, file), { encoding: 'utf8' });
    const jsonStream = readStream.pipe(parser());

    jsonStream.on('data', (data) => {
      if (['startObject', 'endObject', 'startKey', 'startString', 'endString', 'endKey', 'stringChunk'].includes(data.name)) {
        return;
      }
      if (isKey) {
		curKey = data.value;
		isKey = false;
		} else {
		isKey = true;
		res[curKey] = data.value;
		}
    });

    jsonStream.on('end', () => resolve(res));
    jsonStream.on('error', reject);
    readStream.on('error', reject);
  });
}

async function getItems({ curDic, isFolder = true }) {
  try {
    const files = await fsAsync.readdir(curDic);
    return files.filter((file) => {
      const stats = fs.statSync(path.join(curDic, file));
      return isFolder ? stats.isDirectory() : stats.isFile();
    });
  } catch (err) {
    console.log("Can't scan folder:", curDic, err);
  }
}

function createWriter({ dir, fileName }) {
  const writeStream = fs.createWriteStream(path.join(dir, fileName));
  
  writeStream.on('finish', () => console.log('File written successfully'));
  writeStream.on('error', (err) => console.error('Error writing to file', err));
  
  return ({ data, isEnd = false }) => isEnd ? writeStream.end(data) : writeStream.write(data);
}
