import { TransformFunction, TransformOptions } from "../../../types";
import text from "../../html-text";

export interface AddressFieldOptions extends TransformOptions {}

interface AddressFieldShape {
  address_line1?: string;
  address_line2?: string;
  locality?: string;
  administrative_area?: string;
  postal_code?: string;
  country_code?: string;
}

export interface Address {
  addressLineOne?: string;
  addressLineTwo?: string;
  locality?: string;
  regionCode?: string;
  postalCode?: string;
  countryCode?: string;
}

const addressType: TransformFunction<
  Promise<Address | undefined>,
  AddressFieldOptions
> = async (
  value: AddressFieldShape | undefined,
  options: AddressFieldOptions
): Promise<Address | undefined> => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const address: Address = {};

  if (value.address_line1) {
    address.addressLineOne = await text(value.address_line1, options);
  }
  if (value.address_line2) {
    address.addressLineTwo = await text(value.address_line2, options);
  }
  if (value.locality) {
    address.locality = await text(value.locality, options);
  }
  if (value.administrative_area) {
    address.regionCode = await text(value.administrative_area, options);
  }
  if (value.postal_code) {
    address.postalCode = await text(value.postal_code, options);
  }
  if (value.country_code) {
    address.countryCode = await text(value.country_code, options);
  }

  return address;
};

export default addressType;
