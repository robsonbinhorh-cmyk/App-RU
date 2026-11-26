import type { MenuCategoryGroup } from "@/types";

export interface RecommendationMatch {
  ruleId: string;
  matchedItem: string;
  suggestion: string;
}

interface RecommendationRule {
  id: string;
  keywords: string[];
  suggestion: string;
}

const RULES: RecommendationRule[] = [
  {
    id: "feijoada",
    keywords: ["feijoada"],
    suggestion:
      "Hoje tem feijoada! Se você gosta, talvez seja uma boa levar uma farofa de casa.",
  },
  {
    id: "hamburguer",
    keywords: ["hamburguer", "hamburger"],
    suggestion:
      "Hoje tem hambúrguer! Que tal levar ketchup e maionese para acompanhar?",
  },
  {
    id: "macaxeira",
    keywords: ["macaxeira"],
    suggestion:
      "Hoje tem macaxeira! Uma manteiguinha de casa deixa tudo mais gostoso.",
  },
  {
    id: "cachorro-quente",
    keywords: ["cachorro quente", "cachorroquente"],
    suggestion:
      "Hoje tem cachorro-quente! Leve ketchup, maionese e mostarda para completar.",
  },
  {
    id: "batata-frita",
    keywords: ["batata frita"],
    suggestion: "Hoje tem batata frita! Não esqueça de levar ketchup.",
  },
  {
    id: "milho",
    keywords: ["milho"],
    suggestion: "Hoje tem milho! Uma manteiga de casa cai muito bem.",
  },
];

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectItemNames(categories: MenuCategoryGroup[]): string[] {
  const names: string[] = [];
  for (const category of categories) {
    for (const item of category.items) {
      names.push(item.name);
    }
  }
  return names;
}

export function getRecommendations(categories: MenuCategoryGroup[]): RecommendationMatch[] {
  const itemNames = collectItemNames(categories);
  const matches: RecommendationMatch[] = [];
  const seenRules = new Set<string>();

  for (const rule of RULES) {
    if (seenRules.has(rule.id)) continue;

    const normalizedKeywords = rule.keywords.map(normalize);

    for (const itemName of itemNames) {
      const normalizedItem = normalize(itemName);
      if (normalizedKeywords.some((kw) => normalizedItem.includes(kw))) {
        matches.push({
          ruleId: rule.id,
          matchedItem: itemName,
          suggestion: rule.suggestion,
        });
        seenRules.add(rule.id);
        break;
      }
    }
  }

  return matches;
}

export function getRecommendationText(categories: MenuCategoryGroup[]): string {
  const matches = getRecommendations(categories);
  if (matches.length === 0) {
    return "Nenhuma dica especial para o cardápio de hoje.";
  }
  return matches[0].suggestion;
}
