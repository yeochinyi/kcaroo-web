How to setup development environment
------------------------------------

The demo app is written in pure Javascript so that it can run in a pure browser environment without any plug-ins.
But newer browsers have to be used for it to run smoothly.

There are Groovy (which needs Java Development Environment) scripts to convert Excel data into JSON files.
The JSON files are meant to simulate AJAX calls from the server as server side components are not written yet.
However, we can try to plug in Firebase as a quick win to replicate server environment. 

This project is using https://github.com/angular/angular-seed as starting template
The name will likely to change in the future

Prerequisities
--------------
Download and install the following software
1) NPM (or node.js) http://nodejs.org/ (Make sure 'npm' is runnable in PATH)
2) JDK (Version 1.6 or up) (Make sure 'java' is runnable in PATH)
3) Groovy (http://groovy.codehaus.org/) (Make sure 'groovy' is runnable in PATH)
4) GIT client (http://git-scm.com/) to download project from github (online source control) (Make sure 'git' is runnable in PATH)

Steps
-----
1) git clone https://github.com/yeochinyi/angular-seed (To download a copy from the server.)
2) groovy import_excel.groovy kcaroo-converted-data.xlsx (Do this after  excel is populated with static data. This will create json files in app\samples
3) npm install (to install the javascript library)
4) npm start (to start the webserver)
5) Open browser to http://localhost:8000/app 

