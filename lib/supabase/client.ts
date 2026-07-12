export function createClient() {
  return {
    auth: {
      async getUser() {
        try {
          const res = await fetch("/api/auth/session");
          if (!res.ok) return { data: { user: null }, error: new Error("Unauthorized") };
          const data = await res.json();
          return { data: { user: data.user }, error: null };
        } catch (e) {
          return { data: { user: null }, error: e };
        }
      }
    },
    from(table: string) {
      return {
        select(cols: string) {
          return {
            eq(col: string, val: any) {
              return {
                async single() {
                  if (table === "profiles") {
                    try {
                      const res = await fetch("/api/auth/session");
                      if (!res.ok) return { data: null, error: new Error("Unauthorized") };
                      const data = await res.json();
                      return {
                        data: {
                          role: data.user.user_metadata.role,
                          full_name: data.user.user_metadata.full_name
                        },
                        error: null
                      };
                    } catch (e) {
                      return { data: null, error: e };
                    }
                  }
                  return { data: null, error: new Error("Not implemented client-side") };
                }
              };
            }
          };
        }
      };
    }
  } as any;
}
