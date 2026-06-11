import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadYaml(relativePath) {
  const content = readFileSync(join(root, relativePath), "utf8");
  return parseYaml(content);
}

function renderProject(project) {
  const typeLabel =
    project.type === "landing-page"
      ? "Landing Page"
      : project.type === "fullstack"
        ? "Full-Stack"
        : project.type;

  const linkLine = project.url
    ? `[View Live](${project.url})`
    : `*Live URL - add in data/projects.yml*`;

  const techBadges = project.tech.map((t) => `\`${t}\``).join(" ");

  return `### ${project.name}

**${project.role}** @ ${project.company} | ${typeLabel} | ${project.period}

${project.description}

${techBadges}

${linkLine}`;
}

function renderExperience(entry) {
  return `**${entry.role}** @ ${entry.company} | *${entry.period}*

${entry.description}`;
}

function renderSkills(categories) {
  return categories
    .map((category) => {
      const badges = category.skills.map((s) => `![${s.name}](${s.badge})`).join("\n");
      return `**${category.name}**

${badges}`;
    })
    .join("\n\n");
}

function optionalPortfolio(profile) {
  if (!profile.portfolio) {
    return { badge: "", link: "" };
  }
  return {
    badge: `[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-58a6ff?style=flat-square&logo=googlechrome&logoColor=white)](${profile.portfolio})`,
    link: `- **Portfolio:** [Website](${profile.portfolio})`,
  };
}

function renderTemplate(template, vars) {
  return template.replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
    const value = key.split(".").reduce((obj, part) => obj?.[part], vars);
    return value ?? "";
  });
}

function main() {
  const projectsData = loadYaml("data/projects.yml");
  const skillsData = loadYaml("data/skills.yml");
  const template = readFileSync(join(root, "templates/README.template.md"), "utf8");

  const profile = projectsData.profile;
  const featuredProjects = projectsData.projects.filter((p) => p.featured);
  const portfolio = optionalPortfolio(profile);

  const vars = {
    profile,
    portfolio_badge: portfolio.badge,
    portfolio_link: portfolio.link,
    skills_section: renderSkills(skillsData.categories),
    projects_section: featuredProjects.map(renderProject).join("\n\n---\n\n"),
    experience_section: projectsData.experience.map(renderExperience).join("\n\n---\n\n"),
  };

  const output = renderTemplate(template, vars);
  writeFileSync(join(root, "README.md"), output, "utf8");
  console.log("README.md generated successfully.");
}

main();
