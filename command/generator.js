const path = require('path');
const fs = require('fs');
const fse = require('fs-extra')
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const genConfig = require('../tpl/getConfig');
const { writeFileTree, resolveJson, travel, deleteFolderRecursive } = require('../lib/utils');
// 目标文件夹 根路径
let targetRootPath = process.cwd();
// 脚手架模版文件 路径
let template_path = path.join(__dirname, 'template')

async function downLoadTemplate(projectName, spinner) {

  let obj = {}

  function setFile(data) {
    for(let key in data) {
      let dir = './' + projectName + path.dirname(key)
      fse.mkdir(dir, {recursive: true}, (err)=>{
        if(err) {
          spinner.fail()
          return console.error(err)
        }
        fs.writeFileSync('./' + projectName + key, data[key], 'utf-8')
      })
    }
  }

  await travel(template_path, 'template', function (key, pathname){
    let doc = fs.readFileSync(pathname, 'utf-8')
    Object.assign(obj, {
      [key]: doc
    })
  })


  if(!!projectName) {
    await fse.ensureDirSync('./' + projectName, (err)=>{
      if(err) {
        spinner.fail()
        return console.error(err)
      }
    })
    setFile(obj)
  }else {
    setFile(obj)
  }
}

/**
 * 下载项目到本地
 * @param {string} name - 项目名称
 * @param {Object} config - 用户输入的项目基础信息
 */
function copyTemplates(name, config) {
  async function readAndCopyFile(parentPath, tempPath) {
    const spinner = ora('🗃 开始下载模版...').start();
    await downLoadTemplate(name, spinner);
    spinner.succeed('🎉 模版下载完成');
    console.log();
    console.info('🚀 初始化文件配置信息...');
    console.log();
    console.log(parentPath);

    name = name || 'llscw-demo'

    const pkg = {
      name,
      version: '0.1.0',
      private: true,
    }
    
    console.log(pkg,'??????',resolveJson(parentPath))

    await writeFileTree(parentPath, {
      'package.json': JSON.stringify(
        {
          ...resolveJson(parentPath),
          ...pkg
        },
        null,
        2
      )
    });


    await writeFileTree(parentPath, {
      'llscw.config.js': genConfig({
        name: name,
        templateName: config.templateName,
        author: config.author,
      })
    });
    console.log();
    console.log(chalk.green(`🎉 你的项目 ${name} 已创建成功！`));
    console.log();
  }

  readAndCopyFile(path.join(targetRootPath, name), name);
}

async function getTemplateName() {
  return await inquirer.prompt([
    {
      name: 'author',
      type: 'input',
      message: '作者',
      default: 'llscw'
    },
    {
      name: 'templateName',
      type: 'input',
      message: '你还需要给你的模版起个名字',
      default: 'llscw-demo'
    }
  ]);
}

async function generate(name) {
  const config = await getTemplateName();
  // 不创建目录，直接复制到当前目录下
  if(!!name == false) {
    copyTemplates('', config);
    return ;
  }

  const targetDir = path.join(targetRootPath, name);
  
  if (fs.existsSync(targetDir)) {

    // 如果已存在改模块，提问开发者是否覆盖该模块
    inquirer.prompt([
      {
        name: 'template-overwrite',
        type: 'confirm',
        message: `模板 ${name} 已经存在, 是否确认覆盖?`,
        validate: function (input) {
          if (input.lowerCase !== 'y' && input.lowerCase !== 'n') {
            return 'Please input y/n !'
          }
          else {
            return true;
          }
        }
      }
    ])
      .then(answers => {
        console.log('answers', answers);

        // 如果确定覆盖
        if (answers['template-overwrite']) {
          // 删除文件夹
          deleteFolderRecursive(targetDir);
          console.log(chalk.yellow(`template already existed , removing!`));

          //创建新模块文件夹
          fs.mkdirSync(targetDir);
          copyTemplates(name, config);
          console.log(chalk.green(`生成模板 "${name}" 完成!`));
        }
      })
      .catch(err => {
        console.log(chalk.red(err));
      })
  }
  else {
    //创建新模块文件夹
    fs.mkdirSync(targetDir);
    copyTemplates(name, config);
    console.log(chalk.green(`生成模板 "${name}" 完成!`));
  }

}

module.exports = generate;
