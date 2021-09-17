import { Injectable } from '@nestjs/common';

import cryptoLib = require('crypto');
import fs = require('fs');
import path = require('path');

@Injectable()
export class Tools {
  rimraf: Function;

  constructor() {
    this.rimraf = function (dir_path: string) {
      if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach(function (entry) {
          const entry_path = path.join(dir_path, entry);
          if (fs.lstatSync(entry_path).isDirectory()) {
            this.rimraf(entry_path);
          } else {
            fs.unlinkSync(entry_path);
          }
        });
        fs.rmdirSync(dir_path);
      }
    };
  }

  genRandomString(length = 15) {
    return cryptoLib.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  };

  async stall(stallTime = 200) {
    await new Promise(resolve => setTimeout(resolve, stallTime));
  };

  readCookie(key: string, cookies: string) {
    const fullKey = key + "=";
    const seperatedCookies = cookies.split(';');
    seperatedCookies.forEach(cookie => {
      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1, cookie.length);
      }
      if (cookie.indexOf(fullKey) === 0) {
        return cookie.substring(fullKey.length, cookie.length);
      }
    });
    return null;
  };
}
