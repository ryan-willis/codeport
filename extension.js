// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var net = require('net');
// the socket for the python ports created at startup of script
var socketPython;
// the socket for the mel port create at startup of script
var socketMel;
// the socket for the nuke port created at startup of script
var socketNuke;
// variables for ports, can be over ridden in config if you wish to use another port, going to default to 7001 for mel and 7002 for python
var melPort    = 7771;
var pythonPort = 7772;
var nukePort   = 7773;

var mayaHost='localhost';
var nukeHost='localhost';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

var onData = function onData(data) {
    console.log(data.toString());
};

var getText = function(){
    var editor = vscode.window.activeTextEditor;
    var selection = editor.selection;
    var text;
    // if we have selected text only send this
    if (selection.isEmpty != true ) text = editor.document.getText(selection);
    else text = editor.document.getText();

    return text;
};

var sendEditorToSocket = function(socket){
    var text = getText();
    socket.write(text);
    socket.write('\n');
    vscode.window.setStatusBarMessage("code sent to application");
};

var createSocket = function(port, host, application) {
    var sock = net.createConnection(port, host);
    sock.on('error', function(err) {
        var message = "Unable to connect to " + application + " port " + port + " on host " + host + ': ' + err.code;
        console.log(message);
        vscode.window.showWarningMessage(message);
    });
    sock.on('data', onData);
    return sock;
}

function activate(context) {

    console.log('"codeport" is now active!');
    console.log('To use make sure the following code is run in Maya python ');
    var msg=`
import maya.cmds as cmds
try:
    cmds.commandPort(name=":7001", close=True)
except:
    cmds.warning('Could not close port 7001 (maybe it is not opened yet...)')
try:
    cmds.commandPort(name=":7002", close=True)
except:
    cmds.warning('Could not close port 7002 (maybe it is not opened yet...)')

cmds.commandPort(name=":7001", sourceType="mel")
cmds.commandPort(name=":7002", sourceType="python")
`;
    console.log(msg);

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    var disposable_connections = vscode.commands.registerCommand('extension.connectPorts', function () {
        var config = vscode.workspace.getConfiguration('codeport');

        if(config.has('melPort')) melPort       = config.get("melPort");
        if(config.has('pythonPort')) pythonPort = config.get("pythonPort");
        if(config.has('mayaHost')) mayaHost     = config.get("mayaHost");
        if(config.has('nukePort')) nukePort     = config.get("nukePort")
        if(config.has('nukeHost')) nukeHost     = config.get("nukeHost");

        if(config.has("enableMayaMel") && config.get("enableMayaMel")) {
            socketMel = createSocket(melPort, mayaHost, 'Maya');
        }
        if(config.has("enableMayaPython") && config.get("enableMayaPython")) {
            socketPython = createSocket(pythonPort, mayaHost, 'Maya');
        }
        if(config.has("enableNukePython") && config.get("enableNukePython")) {
            socketNuke = createSocket(nukePort, nukeHost, 'Nuke');
        }
    });
    context.subscriptions.push(disposable_connections);


    var d_py_my = vscode.commands.registerCommand('extension.sendPythonToMaya', function() {
        sendEditorToSocket(socketPython);
    });
    context.subscriptions.push(d_py_my);

    var d_mel_my = vscode.commands.registerCommand('extension.sendMelToMaya', function() {
        sendEditorToSocket(socketMel)
    });
    context.subscriptions.push(d_mel_my);

    var d_py_nuke = vscode.commands.registerCommand('extension.sendPythonToNuke', function() {
        sendEditorToSocket(socketNuke);
    });
    context.subscriptions.push(d_py_nuke);
}

exports.activate = activate;


// this method is called when your extension is deactivated
function deactivate() {
    socketMel.close();
    socketPython.close();
    socketNuke.close();
}
exports.deactivate = deactivate;