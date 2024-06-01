const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readlineSync = require('readline-sync');

function saveKeyAndIv(key, iv, filePath) {
  const data = { key: key.toString('hex'), iv: iv.toString('hex') };
  fs.writeFileSync(filePath, JSON.stringify(data));
}

function readKeyAndIv(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(data);
  return { key: Buffer.from(parsed.key, 'hex'), iv: Buffer.from(parsed.iv, 'hex') };
}
function encryptFileName(fileName, key, iv) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(fileName, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptFileName(encryptedFileName, key, iv) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedFileName, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
function encryptFile(filePath, algorithm, key, iv) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const input = fs.createReadStream(filePath);
  const encryptedFileName = encryptFileName(path.basename(filePath), key, iv) + '.enc';
  const output = fs.createWriteStream(path.join(path.dirname(filePath), encryptedFileName));

  input.pipe(cipher).pipe(output);

  output.on('finish', () => {
    console.log(`File encrypted: ${encryptedFileName}`);
    fs.unlink(filePath, (err) => {
      if (err) throw err;
      console.log(`Original file deleted: ${filePath}`);
    });
  });
}

function decryptFile(filePath, algorithm, key, iv) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const input = fs.createReadStream(filePath);
  const decryptedFileName = decryptFileName(path.basename(filePath, '.enc'), key, iv);
  const output = fs.createWriteStream(path.join(path.dirname(filePath), decryptedFileName));

  input.pipe(decipher).pipe(output);

  output.on('finish', () => {
    console.log(`File decrypted: ${decryptedFileName}`);
    fs.unlink(filePath, (err) => {
      if (err) throw err;
      console.log(`Encrypted file deleted: ${filePath}`);
    });
  });
}

function processFilesInDirectory(directoryPath, algorithm, key, iv, operation) {
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error(`Could not list the directory.`, err);
      process.exit(1);
    }

    files.forEach((file, index) => {
      const filePath = path.join(directoryPath, file);

      fs.stat(filePath, (error, stat) => {
        if (error) {
          console.error(`Error stating file.`, error);
          return;
        }

        if (stat.isFile()) {
          if (operation === 'encrypt' && !file.endsWith('.enc')) {
            encryptFile(filePath, algorithm, key, iv);
          } else if (operation === 'decrypt' && file.endsWith('.enc')) {
            decryptFile(filePath, algorithm, key, iv);
          }
        }
      });
    });
  });
}

const algorithm = 'aes-256-cbc';
const directoryPath = '../files';
const keyFilePath = './key_iv.json';
const option = readlineSync.question('Wybierz opcję (1 - Zablokuj pliki, 2 - Odblokuj pliki): ');

if (option === '1') {
  const key = crypto.randomBytes(32); // klucz 256-bitowy
  const iv = crypto.randomBytes(16);  // wektor inicjalizacyjny 128-bitowy

  saveKeyAndIv(key, iv, keyFilePath);

  processFilesInDirectory(directoryPath, algorithm, key, iv, 'encrypt');
} else if (option === '2') {
  const pin = readlineSync.question('Podaj PIN: ', { hideEchoBack: true });

  // Przykładowy PIN do weryfikacji (ustaw tutaj własny)
  const correctPin = '1234';

  if (pin === correctPin) {
    const { key, iv } = readKeyAndIv(keyFilePath);
    processFilesInDirectory(directoryPath, algorithm, key, iv, 'decrypt');
  } else {
    console.log('Nieprawidłowy PIN!');
  }
} else {
  console.log('Nieprawidłowa opcja!');
}
