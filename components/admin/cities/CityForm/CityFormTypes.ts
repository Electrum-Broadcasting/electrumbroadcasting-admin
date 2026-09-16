export type CityStatus = "draft" | "published";

export type CityFormPayload = {
  id?: string;
  name: string;
  slug: string;
  domain: string;
  status: CityStatus;
  incorporated_year: number | null;
  description: string | null;
  country: string | null;
  state_province: string | null;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
};

export type CityFormValue = {
  id?: string;
  name?: string;
  slug?: string;
  domain?: string;
  status?: CityStatus;
  incorporated_year?: number | null;
  description?: string | null;
  country?: string | null;
  state_province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  population?: number | null;
};

export type CityFormProps = {
  mode: "create" | "edit";
  city?: CityFormValue | null;
  error?: string | null;
};
