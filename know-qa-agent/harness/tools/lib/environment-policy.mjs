export function writeAllowedForConfig(pageValue, config) {
  try {
    const page = new URL(pageValue);
    return (config.environments ?? []).some((entry) => {
      try {
        const allowed = new URL(entry.origin);
        return entry.write_allowed === true
          && allowed.protocol === page.protocol
          && allowed.hostname === page.hostname
          && (!allowed.port || allowed.port === page.port);
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}
