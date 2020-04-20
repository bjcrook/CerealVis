const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");

class SerialPortClass {
  constructor() {
    this.baudRate = 9600;
    this.currentPath = null;
    this.possible_ports = [];
    this.CreatePortList();
    this.connected = () => {
      if (this.port == null) {
        console.log("SerialPort: No port established");
        return false;
      }
      return true;
    };
  }

  async CreatePortList() {
    // this function creates an array of available ports
    // before anything is added to the array, the array is cleared
    this.possible_ports = [];
    var ports = await SerialPort.list();
    for (var i = 0; i < ports.length; i++) {
      if (ports[i].manufacturer != undefined) {
        this.possible_ports.push({
          manufacturer: ports[i].manufacturer,
          path: ports[i].path,
        });
      }
    }
  }

  GetPortList() {
    // this function returns the array of available ports
    return this.possible_ports;
  }

  Connect(event, path = "AUTO") {
    // this function attempts to create a connection with a specified port
    // if no port is specified the function attempts to create a connection with an arduino module
    // returns true when a was connection made, false when a connection was not made
    var valid_port = false;

    for (var i = 0; i < this.possible_ports.length; i++) {
      if (path == "AUTO") {
        if (
          this.possible_ports[i].manufacturer.includes("Arduino") ||
          this.possible_ports[i].manufacturer.includes("Silicon Labs")
        ) {
          path = this.possible_ports[i].path;
          valid_port = true;
          break;
        }
      } else {
        if (this.possible_ports[i].path == path) {
          valid_port = true;
          break;
        }
      }
    }

    if (this.currentPath == path) {
      return true;
    }

    if (valid_port) {
      this.port = new SerialPort(path, { baudRate: this.baudRate }, function (
        err
      ) {
        if (err) {
          console.log("Error: " + err.message);
        }
      });
      this.parser = this.port.pipe(new Readline({ delimiter: "\r\n" }));
      this.parser.on("data", event);
      this.currentPath = path;
      return true;
    }

    return false;
  }

  async EnsureDisconnect() {
    this.port.write("p").then(() => {
      return;
    });
  }

  async Disconnect() {
    if (!this.connected()) return;
    await this.EnsureDisconnect();
    this.port.close();
    this.port = null;
    this.parser = null;
    this.currentPath = null;
    console.log("SerialPort: Port closed");
  }

  Start() {
    if (!this.connected()) return;
    this.port.write("g");
    console.log("SerialPort: Starting Data Flow");
  }

  Stop() {
    if (!this.connected()) return;
    this.port.write("p");
    console.log("SerialPort: Stopping Data Flow");
  }
}

module.exports.SerialPortClass = SerialPortClass;
