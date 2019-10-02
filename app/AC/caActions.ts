import { ICertificateRequestCA } from "../components/Services/types";
import {
  FAIL, GET_CA_CERTREQUEST,
  GET_CA_CERTREQUEST_STATUS, GET_CA_REGREQUEST, HOME_DIR, POST_CA_CERTREQUEST,
  POST_CA_CERTREQUEST_СONFIRMATION, POST_CA_REGREQUEST, START, SUCCESS,
} from "../constants";
import { uuid } from "../utils";

export async function postApi(url: string, postfields: any, headerfields: string[]) {
  return new Promise((resolve, reject) => {
    const curl = new window.Curl();

    curl.setOpt("URL", url);
    curl.setOpt("FOLLOWLOCATION", true);
    curl.setOpt(window.Curl.option.HTTPHEADER, headerfields);
    curl.setOpt(window.Curl.option.POSTFIELDS, postfields);

    curl.on("end", function(statusCode: number, response: { toString: () => string; }) {
      let data;

      try {

        if (statusCode !== 200) {
          throw new Error(`Unexpected response, status code ${statusCode}`);
        }

        data = JSON.parse(response.toString());

      } catch (error) {
        reject(`Cannot load data, error: ${error.message}`);
        return;
      } finally {
        curl.close.bind(curl);
      }

      resolve(data);
    });

    curl.on("error", (error: { message: any; }) => {
      curl.close.bind(curl);
      reject(new Error(`Cannot load data by url ${url}, error: ${error.message}`));
    });

    curl.perform();
  });
}

export async function getApiStatus(url: string, headerfields: string[] ) {
  return new Promise((resolve, reject) => {
    const curl = new window.Curl();

    curl.setOpt("URL", url);
    curl.setOpt("FOLLOWLOCATION", true);
    curl.setOpt(window.Curl.option.HTTPHEADER, headerfields);
    curl.on("end", function(statusCode: number, response: { toString: () => string; }) {
      try {
        if (statusCode !== 200) {
          throw new Error(`Unexpected response, status code ${statusCode}`);
        }
      } catch (error) {
        reject(`Cannot load data, error: ${error.message}`);
        return;
      } finally {
        curl.close.bind(curl);
      }

      resolve(response);
    });

    curl.on("error", (error: { message: any; }) => {
      curl.close.bind(curl);
      reject(new Error(`Cannot load data by url ${url}, error: ${error.message}`));
    });

    curl.perform();
  });
}

export async function getApi(url: string, headerfields: string[] ) {
  return new Promise((resolve, reject) => {
    const curl = new window.Curl();
    let data = new Buffer("");

    curl.setOpt("URL", url);
    curl.setOpt("FOLLOWLOCATION", true);
    curl.setOpt(window.Curl.option.HTTPHEADER, headerfields);
    curl.on("end", function(statusCode: number, response: { toString: () => string; }) {
      try {
        if (statusCode !== 200) {
          throw new Error(`Unexpected response, status code ${statusCode}`);
        }
        //data = JSON.parse(response.toString());
      } catch (error) {
        reject(`Cannot load data, error: ${error.message}`);
        return;
      } finally {
        curl.close.bind(curl);
      }

      //console.log(new TextEncoder().encode(new TextDecoder().decode(data)));
      const cert = new trusted.pki.Certificate();
      cert.import(data);
      resolve(cert.export(trusted.DataFormat.PEM).toString());
    });

    curl.on('data', (chunk, curlInstance) => {
      data = Buffer.concat([data, chunk]);
      return chunk.length;
    });

    curl.on("error", (error: { message: any; }) => {
      curl.close.bind(curl);
      reject(new Error(`Cannot load data by url ${url}, error: ${error.message}`));
    });

    curl.perform();
  });
}

export function postRegRequest(url: string, comment: string, description: string, email: string, keyPhrase: string, oids: any, serviceId: string) {
  return (dispatch) => {
    dispatch({
      type: POST_CA_REGREQUEST + START,
    });

    setTimeout(async () => {
      let data: any;

      try {
        const OidArray = Object.keys(oids).map(function (key) {
          return { [key]: oids[key] };
        });

        data = await postApi(`${url}/regrequest`, JSON.stringify({
          Comment: comment,
          Description: description,
          Email: email,
          KeyPhrase: keyPhrase,
          OidArray,
        }),
          [
            "Content-Type: application/json",
            "Accept: application/json",
          ]);

        dispatch({
          payload: {
            RDN: oids,
            id: data.RegRequest.RegRequestId,
            regRequest: data.RegRequest,
            serviceId,
          },
          type: POST_CA_REGREQUEST + SUCCESS,
        });
      } catch (e) {
        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: POST_CA_REGREQUEST + FAIL,
        });
      }
    }, 0);
  };
}

export function getRegRequest(url: string, Token: string, Password: string, serviceId: string) {
  return (dispatch) => {
    dispatch({
      type: GET_CA_REGREQUEST + START,
    });

    setTimeout(async () => {
      let data: any;

      try {
        data = await getApiStatus(
          `${url}/regrequest`,
          [
            "Content-Type: application/json",
            `Authorization: Basic ${Buffer.from(Token + ":" + Password).toString("base64")}`,
          ],
        );

        data = JSON.parse(data.toString());
        const statusRegRequest = data.RegRequest.Status;

        url = url.substr(0, url.lastIndexOf("/"));
        data = await getApiStatus(
          `${url}/regrequest/profile?type=json`,
          [
            "Content-Type: application/json",
            `Authorization: Basic ${Buffer.from(Token + ":" + Password).toString("base64")}`,
          ],
        );

        data = JSON.parse(data.toString());
        const profile = data.Profile.reduce((obj, item) => ({...obj, ...item}), {});
        const regRequestId = uuid();

        dispatch({
          payload: {
            RDN: profile,
            id: regRequestId,
            regRequest: {
              Password,
              RegRequestId: regRequestId,
              Status: statusRegRequest,
              Token,
            },
            serviceId,
          },
            type: GET_CA_REGREQUEST + SUCCESS,
        });
      } catch (e) {
        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: GET_CA_REGREQUEST + FAIL,
        });
      }
    }, 0);
  };
}

export function postCertRequest(url: string, certificateRequestCA: ICertificateRequestCA, subject: any, regRequest: any, serviceId: string) {
  return (dispatch) => {
    dispatch({
      type: POST_CA_CERTREQUEST + START,
    });

    setTimeout(async () => {
      let data: any;

      try {
        url = url.substr(0, url.lastIndexOf("/"));
        data = await postApi(
          `${url}/certrequest`,
          certificateRequestCA.certificateReq,
          [
            "Content-Type: application/octet-stream",
            `Authorization: Basic ${Buffer.from(regRequest.Token + ":" + regRequest.Password).toString("base64")}`,
          ],
        );
        dispatch({
          payload: {
            certRequestId: data.CertRequest.CertRequestId,
            id: certificateRequestCA.id,
            serviceId,
            status: data.CertRequest.Status,
            subject,
          },
          type: POST_CA_CERTREQUEST + SUCCESS,
        });
      } catch (e) {
        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: POST_CA_CERTREQUEST + FAIL,
        });
      }
    }, 0);
  };
}

export function postCertRequestСonfirmation(url: string, certificateRequestCA: ICertificateRequestCA, regRequest: any) {
  return (dispatch) => {
    dispatch({
      type: POST_CA_CERTREQUEST_СONFIRMATION + START,
    });

    setTimeout(async () => {
      let data: any;
      const dataStatus = {
        Status: "K",
      };
      try {
        url = url.substr(0, url.lastIndexOf("/"));
        data = await postApi(
          `${url}/certrequest/${certificateRequestCA.certRequestId}`,
          JSON.stringify(dataStatus),
          [
            "Content-Type: application/json",
            "Accept: */*",
            `Authorization: Basic ${Buffer.from(regRequest.Token + ":" + regRequest.Password).toString("base64")}`,
          ],
        );
        console.log(data);
        dispatch({
          payload: {
            id: certificateRequestCA.id,
            status: data.CertRequest.Status,
          },
          type: POST_CA_CERTREQUEST_СONFIRMATION + SUCCESS,
        });
      } catch (e) {
        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: POST_CA_CERTREQUEST_СONFIRMATION + FAIL,
        });
      }
    }, 0);
  };
}

export function getCertRequestStatus(url: string, certRequest: ICertificateRequestCA, regRequest: any) {
  return (dispatch) => {
    dispatch({
      type: GET_CA_CERTREQUEST_STATUS + START,
    });

    setTimeout(async () => {
      let data: any;

      try {
        url = url.substr(0, url.lastIndexOf("/"));
        data = await getApiStatus(
          `${url}/certrequest/${certRequest.certRequestId}`,
          [
            `Authorization: Basic ${Buffer.from(regRequest.Token + ":" + regRequest.Password).toString("base64")}`,
          ],
        );
        data = JSON.parse(data.toString());

        dispatch({
          payload: {
            id: certRequest.id,
            status: data.CertRequest.Status,
          },
            type: GET_CA_CERTREQUEST_STATUS + SUCCESS,
        });
      } catch (e) {
        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: GET_CA_CERTREQUEST_STATUS + FAIL,
        });
      }
    }, 0);
  };
}

export function getCertRequest(url: string, certRequest: ICertificateRequestCA, regRequest: any) {
  return (dispatch) => {
    dispatch({
      type: GET_CA_CERTREQUEST + START,
    });

    setTimeout(async () => {
      let data: any;

      try {
        url = url.substr(0, url.lastIndexOf("/"));
        data = await getApi(
          `${url}/certrequest/${certRequest.certRequestId}/rawcert`,
          [
            "Content-Type: application/octet-stream",
            `Authorization: Basic ${Buffer.from(regRequest.Token + ":" + regRequest.Password).toString("base64")}`,
          ],
        );

        dispatch({
          payload: {
            certificate: data,
            id: certRequest.id,
          },
            type: GET_CA_CERTREQUEST + SUCCESS,
        });
      } catch (e) {
        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: GET_CA_CERTREQUEST + FAIL,
        });
      }
    }, 0);
  };
}