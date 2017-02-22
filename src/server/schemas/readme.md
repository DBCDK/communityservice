# JSON schemas

The schemas here govern the input to the web service.  All HTTP input to the service is checked against the corresponding schema, so when a profile is PUT through the service, the HTTP body is chaecked against the `profile-put.json` schema.

The output of the web service is also required to adhere to the schemas named `*-out.json`, but these schemas are only used by the integration testing.
