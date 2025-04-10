import { DefaultNotFound } from "./default-not-found";

export function PropertyNotFound() {
  return (
    <DefaultNotFound
      title="Property Not Found"
      message="We couldn't find the property you're looking for."
      resourceType="Property"
      resourceId={"ajdlkf"}
    />
  );
}
