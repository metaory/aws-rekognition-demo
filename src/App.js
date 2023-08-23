import "./App.css";
import React, { Component } from "react";

import JSONPretty from "react-json-pretty";
import JSONPrettyTheme from "react-json-pretty/dist/monikai";

import {
  RekognitionClient,
  DetectModerationLabelsCommand,
} from "@aws-sdk/client-rekognition";

const region = process.env.REACT_APP_REGION || "ap-southeast-1";

const credentials = {
  accessKeyId: process.env.REACT_APP_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_SECRET_ACCESS_KEY,
};

const reader = (file) =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr);
    fr.onerror = (err) => reject(err);
    fr.readAsDataURL(file);
    // fr.readAsArrayBuffer(file); // This other way also worked
  });

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      moderationResult: JSON.stringify({ ERROR: "Select and image!" }),
      imagePreview: `${process.env.PUBLIC_URL}/placeholder.png`,
      credentials,
    };
  }

  handleFileChange = async (e) => {
    const [file] = e.target.files;
    if (!file) return;

    const { result } = await reader(file);

    this.setState({ imagePreview: result });
    const base64 = atob(result.split("base64,")[1]);

    const imageBytes = new ArrayBuffer(base64.length);

    const ua = new Uint8Array(imageBytes).map((_, i) => base64.charCodeAt(i));

    console.log("this.state.credentials:", this.state.credentials);

    const { credentials } = this.state;

    const client = new RekognitionClient({ region, credentials });

    const input = {
      Image: { Bytes: ua },
      Attributes: ["ALL"],
      MaxLabels: 10,
      MinConfidence: 77,
    };

    const command = new DetectModerationLabelsCommand(input);
    const response = await client.send(command);

    console.log("response:", response);
    this.setState({ moderationResult: JSON.stringify(response, null, 2) });
  };

  handleAccessKeyIdChange = ({ target: { value } }) => {
    this.setState({
      credentials: { ...this.state.credentials, accessKeyId: value },
    });
  };

  handleSecretKeyChange = ({ target: { value } }) => {
    this.setState({
      credentials: { ...this.state.credentials, secretAccessKey: value },
    });
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <label>
            accessKeyId
            <input
              value={this.state.credentials.accessKeyId}
              onChange={this.handleAccessKeyIdChange}
              type="text"
            />
          </label>

          <label>
            secretAccessKey
            <input
              value={this.state.credentials.secretAccessKey}
              onChange={this.handleSecretKeyChange}
              type="text"
            />
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={this.handleFileChange}
          />

          <img src={this.state.imagePreview} alt="preview" />

          <JSONPretty
            id="json-pretty"
            mainStyle="text-align:left"
            theme={JSONPrettyTheme}
            data={this.state.moderationResult}
          ></JSONPretty>
        </header>
      </div>
    );
  }
}
