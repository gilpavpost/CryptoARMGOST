import { Map, OrderedMap, Record } from "immutable";
import { FAIL, LOAD_LICENSE,
  START, SUCCESS, VERIFY_LICENSE } from "../constants";
import { arrayToMap } from "../utils";

const LicenseModel = Record({
  aud: "-",
  exp: null,
  iat: null,
  iss: "-",
  jti: "-",
  sub: "-",
});

const DefaultReducerState = Record({
  data: null,
  info: new LicenseModel(),
  loaded: false,
  loading: false,
  status: null,
  verified: false,
  lic_format: null,
});

export default (license = new DefaultReducerState(), action) => {
  const { type, payload } = action;

  switch (type) {
    case LOAD_LICENSE + START:
      return license.set("loading", true);

    case LOAD_LICENSE + SUCCESS:
      return license
        .set("info", new LicenseModel(payload.lic))
        .set("data", payload.data)
        .set("loading", false)
        .set("loaded", true)
        .set("lic_format",payload.lic_format);

    case LOAD_LICENSE + FAIL:
        return license
          .set("loading", false)
          .set("loaded", true);

    case VERIFY_LICENSE:
      return license
        .set("status", payload.licenseStatus)
        .set("verified", true)
        .set("lic_format",payload.lic_format);
  }

  return license;
};
