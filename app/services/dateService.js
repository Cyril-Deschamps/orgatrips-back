import { format as dateFormat } from "date-fns";
import { fr } from "date-fns/locale";

export function formatDate(date, pattern = "PP") {
  return dateFormat(date, pattern, { locale: fr });
}
