const MAX_JSON_BODY_BYTES = 32 * 1024;

function tooLargeError() {
  const error = new Error("Request body too large");
  error.statusCode = 413;
  return error;
}

function parseJsonBody(body) {
  if (Buffer.byteLength(body || "", "utf8") > MAX_JSON_BODY_BYTES) {
    throw tooLargeError();
  }

  try {
    return body ? JSON.parse(body) : {};
  } catch (error) {
    error.statusCode = 400;
    throw error;
  }
}

function readJsonBody(request) {
  if (request.body && typeof request.body === "object") {
    return Promise.resolve(request.body);
  }

  if (typeof request.body === "string") {
    return Promise.resolve(parseJsonBody(request.body));
  }

  return new Promise((resolve, reject) => {
    let body = "";
    let bytes = 0;
    let settled = false;

    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    request.on("data", (chunk) => {
      bytes += Buffer.byteLength(chunk);
      if (bytes > MAX_JSON_BODY_BYTES) {
        rejectOnce(tooLargeError());
        request.destroy?.();
        return;
      }

      body += chunk;
    });
    request.on("end", () => {
      if (settled) return;
      settled = true;

      try {
        resolve(parseJsonBody(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", rejectOnce);
  });
}

module.exports = { readJsonBody };
