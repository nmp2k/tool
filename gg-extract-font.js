const fs = require('fs');
const path = require('path');
const fsAsync = fs.promises;

const currentDirectory = __dirname;

(async (_) => {
  try {
    const folders = await getItems({
      curDic: currentDirectory,
    });
    const allFileStr = await Promise.all(
      folders.map(async (item) => {
        const relativePath =
          repRoot(currentDirectory).replace(/\\/g, '/') + `/${item}`;
        const normalizeFolderName = normalizeText(item);
        const curDic = path.join(currentDirectory, item);
        const files = await getItems({ curDic, isFolder: false });
        const fileObj = files.map((file) => {
          const res = {};
          const filenameNormalize = normalizeText(file);
          res.weight = getFontWeight(filenameNormalize);
          res.path = relativePath + `/${file}`;
          res.variable = `--font-${normalizeFolderName}`;
          res.display = 'swap';
          res.style = filenameNormalize.includes('italic')
            ? 'italic'
            : 'normal';
          res.id = res.style === 'normal' ? 0 : 1;
          return res;
        });
        return fileObj.sort((a, b) => (a.id > b.id ? -1 : 1));
      }),
    );
    console.log(allFileStr);
  } catch (e) {
    console.log(e);
  }
})();

// return folder or file
async function getItems({ curDic, isFolder = true }) {
  try {
    const files = await fsAsync.readdir(curDic);
    const cur = files.filter((file) => {
      const curFile = fs.statSync(path.join(curDic, file));
      return isFolder ? curFile.isDirectory() : curFile.isFile();
    });
    return cur;
  } catch {
    console.log("Can't scan folder: ", curDic);
  }
}
// replace root function
function repRoot(root) {
  const newPath = root.replace(/.*(?=\\src)/, '@');
  return newPath;
}

function getFontWeight(fname) {
  const font = {
    thin: 100,
    hairline: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  };

  const sizeName = Object.keys(font).find((ele) => {
    return fname.includes(ele);
  });
  const res = font[sizeName] || font.regular;
  return res.toString();
}

function normalizeText(text) {
  return text.replace(/[-_ ]/gi, '').toLocaleLowerCase();
}
