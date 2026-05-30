"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ForwardedRef,
} from "react";
import ELK, { type ElkNode } from "elkjs/lib/elk.bundled";
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  getBezierPath,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type EdgeTypes,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import { motion, useDragControls } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getCountryNameForCode } from "@/components/custom/countries";
import {
  formatPersonFirstNameForLocale,
  formatPersonLastNameForLocale,
  formatPersonNameForLocale,
  type PersonSearchRecord,
  type PersonSearchRecordWithBirth,
} from "@/components/custom/person-search";
import { apiFetch } from "@/lib/api/auth/api-fetch";
import { cn } from "@/lib/utils";

const NODE_WIDTH = 218;
const NODE_HEIGHT = 118;
const SENTINEL = "ZLITNI";

type ParentMarriageRef = {
  id: number;
  firstPartnerId: number;
  secondPartnerId: number | null;
};

export type TreePerson = PersonSearchRecordWithBirth & {
  parentMarriageId: number | null;
  isMale: boolean | null;
  isAlive: boolean | null;
  birthCity: string | null;
  birthCountryCode: string | null;
  deathYear: number | null;
  deathMonth: number | null;
  deathDay: number | null;
  deathCity: string | null;
  deathCountryCode: string | null;
  parentMarriage: ParentMarriageRef | null;
};

type TreeMarriage = {
  id: number;
  firstPartnerId: number;
  secondPartnerId: number | null;
  firstPartner: PersonSearchRecordWithBirth;
  secondPartner: PersonSearchRecordWithBirth | null;
};

type TreeResponse = {
  ok: boolean;
  sentinel?: string;
  persons?: TreePerson[];
  marriages?: TreeMarriage[];
  message?: string;
};

type FamilyNodeData = {
  fullName: string;
  birthText: string;
  spouseName: string | null;
  hasParents: boolean;
  hasChildren: boolean;
  highlight: "none" | "hover" | "selected";
  active: boolean;
  dimmed: boolean;
};

type FamilyNode = Node<FamilyNodeData, "familyPerson">;

export type FamilyTreeHandle = {
  fitView: () => void;
  focusPerson: (personId: number) => void;
  pushFocus: (personId: number) => void;
};

function normalizeLastName(person: PersonSearchRecord | null | undefined) {
  return (person?.lastName ?? "").trim().toUpperCase();
}

function isSentinelPerson(person: PersonSearchRecord | null | undefined) {
  return normalizeLastName(person) === SENTINEL;
}

function buildPaternalLine(
  person: TreePerson,
  personsById: Map<number, TreePerson>,
  connectors: { sonOf: string; daughterOf: string; childOf: string },
  locale: string,
) {
  const chain: TreePerson[] = [person];
  let current: TreePerson | undefined = person;
  const seen = new Set([person.id]);

  while (current?.parentMarriage?.firstPartnerId) {
    const father = personsById.get(current.parentMarriage.firstPartnerId);
    if (!father || seen.has(father.id)) break;

    chain.push(father);
    seen.add(father.id);

    if (father.isMale === false || !isSentinelPerson(father)) break;
    current = father;
  }

  const rootIndex = chain.length - 1;
  let line =
    formatPersonFirstNameForLocale(chain[0], locale) ||
    formatPersonNameForLocale(chain[0], locale);

  for (let index = 1; index < chain.length; index += 1) {
    const child = chain[index - 1];
    const parent = chain[index];
    const connector =
      child.isMale === true
        ? connectors.sonOf
        : child.isMale === false
          ? connectors.daughterOf
          : connectors.childOf;
    const parentName =
      index === rootIndex
        ? formatPersonNameForLocale(parent, locale)
        : formatPersonFirstNameForLocale(parent, locale) ||
          formatPersonNameForLocale(parent, locale);

    line = `${line} ${connector} ${parentName}`;
  }

  return line;
}

function formatDateParts(
  year: number | null | undefined,
  month: number | null | undefined,
  day: number | null | undefined,
  locale: string,
) {
  if (
    year !== null &&
    year !== undefined &&
    month !== null &&
    month !== undefined &&
    day !== null &&
    day !== undefined &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31
  ) {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  if (
    year !== null &&
    year !== undefined &&
    month !== null &&
    month !== undefined &&
    month >= 1 &&
    month <= 12
  ) {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  }

  const paddedMonth =
    month === null || month === undefined
      ? null
      : String(month).padStart(2, "0");
  const paddedDay =
    day === null || day === undefined ? null : String(day).padStart(2, "0");

  if (year !== null && year !== undefined && paddedMonth && paddedDay) {
    return `${year}-${paddedMonth}-${paddedDay}`;
  }
  if (year !== null && year !== undefined && paddedMonth) {
    return `${year}-${paddedMonth}`;
  }
  if (year !== null && year !== undefined) return String(year);
  if (paddedMonth && paddedDay) return `${paddedMonth}-${paddedDay}`;
  if (paddedMonth) return paddedMonth;
  if (paddedDay) return paddedDay;

  return null;
}

function formatLifeEvent(
  {
    year,
    month,
    day,
    city,
    countryCode,
  }: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
    city?: string | null;
    countryCode?: string | null;
  },
  locale: string,
  unknown: string,
) {
  const date = formatDateParts(year, month, day, locale);
  const cityText = city?.trim() || null;
  const countryText = countryCode?.trim()
    ? getCountryNameForCode(countryCode, locale)
    : null;
  const parts = [date, cityText, countryText].filter(Boolean);

  return parts.length ? parts.join(", ") : unknown;
}

function hasDeathData(person: TreePerson) {
  return Boolean(
    person.deathYear ||
    person.deathMonth ||
    person.deathDay ||
    person.deathCity ||
    person.deathCountryCode ||
    person.isAlive === false,
  );
}

function calculateAge(
  person: TreePerson,
  unknown: string,
  approximate: (age: number) => string,
) {
  if (!person.birthYear) return unknown;

  const hasDeathYear =
    person.deathYear !== null && person.deathYear !== undefined;
  if (person.isAlive === false && !hasDeathYear) return unknown;

  const end = hasDeathYear
    ? {
        year: person.deathYear as number,
        month: person.deathMonth,
        day: person.deathDay,
      }
    : {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate(),
      };

  let age = end.year - person.birthYear;
  const exact =
    person.birthMonth !== null &&
    person.birthMonth !== undefined &&
    person.birthDay !== null &&
    person.birthDay !== undefined &&
    end.month !== null &&
    end.month !== undefined &&
    end.day !== null &&
    end.day !== undefined;

  if (exact) {
    const birthMonth = person.birthMonth as number;
    const birthDay = person.birthDay as number;
    const endMonth = end.month as number;
    const endDay = end.day as number;
    const birthdayHasPassed =
      endMonth > birthMonth || (endMonth === birthMonth && endDay >= birthDay);

    if (!birthdayHasPassed) age -= 1;
  }

  const normalizedAge = Math.max(age, 0);
  return exact ? String(normalizedAge) : approximate(normalizedAge);
}

function FamilyPersonNode({ data }: NodeProps<FamilyNode>) {
  const isHoverPath = data.highlight === "hover";
  const isSelectedPath = data.highlight === "selected";

  return (
    <div
      className={cn(
        "relative flex h-[118px] w-[218px] flex-col justify-center rounded-[1.35rem] border px-5 py-4 shadow-sm transition-all duration-200",
        "bg-card/92 text-card-foreground backdrop-blur-xl",
        data.dimmed && "opacity-35",
        !data.dimmed && "opacity-100",
        isHoverPath &&
          "border-amber-400/80 bg-amber-100/80 shadow-amber-500/15 dark:bg-amber-500/15",
        isSelectedPath &&
          "border-primary/85 bg-primary/12 shadow-primary/15 dark:bg-primary/15",
        data.active &&
          "ring-primary/45 border-primary shadow-primary/20 shadow-lg ring-2",
        !isHoverPath && !isSelectedPath && !data.active && "border-border/80",
      )}
    >
      {data.hasParents ? (
        <Handle
          type="target"
          position={Position.Top}
          className="!border-card !bg-foreground !h-3.5 !w-3.5 !border-2"
        />
      ) : null}
      <p className="truncate text-lg leading-6 font-semibold">
        {data.fullName}
      </p>
      <p className="text-muted-foreground mt-1 text-sm font-medium">
        {data.birthText}
      </p>
      {data.spouseName ? (
        <p className="mt-2 truncate text-sm font-medium">{data.spouseName}</p>
      ) : null}
      {data.hasChildren ? (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!border-card !bg-foreground !h-3.5 !w-3.5 !border-2"
        />
      ) : null}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  familyPerson: FamilyPersonNode,
};

function OrganicFamilyEdge(props: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    curvature: props.animated ? 0.52 : 0.44,
  });

  return (
    <BaseEdge
      id={props.id}
      path={edgePath}
      markerEnd={props.markerEnd}
      style={props.style}
      interactionWidth={props.interactionWidth ?? 28}
    />
  );
}

const edgeTypes: EdgeTypes = {
  organic: OrganicFamilyEdge,
};

function buildSpouseLookup(marriages: TreeMarriage[]) {
  const spouses = new Map<number, PersonSearchRecordWithBirth>();

  for (const marriage of marriages) {
    if (marriage.secondPartner) {
      if (!spouses.has(marriage.firstPartnerId)) {
        spouses.set(marriage.firstPartnerId, marriage.secondPartner);
      }
      if (!spouses.has(marriage.secondPartner.id)) {
        spouses.set(marriage.secondPartner.id, marriage.firstPartner);
      }
    }
  }

  return spouses;
}

function buildSpouseIdLookup(marriages: TreeMarriage[]) {
  const spouses = new Map<number, number[]>();

  function addSpouse(personId: number, spouseId: number) {
    const existing = spouses.get(personId) ?? [];
    if (!existing.includes(spouseId)) {
      spouses.set(personId, [...existing, spouseId]);
    }
  }

  for (const marriage of marriages) {
    if (marriage.secondPartnerId) {
      addSpouse(marriage.firstPartnerId, marriage.secondPartnerId);
      addSpouse(marriage.secondPartnerId, marriage.firstPartnerId);
    }
  }

  return spouses;
}

function buildChildrenLookup(persons: TreePerson[]) {
  const children = new Map<number, TreePerson[]>();

  function addChild(parentId: number | null | undefined, child: TreePerson) {
    if (!parentId) return;
    const existing = children.get(parentId) ?? [];
    children.set(parentId, [...existing, child]);
  }

  for (const person of persons) {
    addChild(person.parentMarriage?.firstPartnerId, person);
    addChild(person.parentMarriage?.secondPartnerId, person);
  }

  return children;
}

function resolveVisibleFocusId(
  personId: number,
  personsById: Map<number, TreePerson>,
  spouseIdsByPersonId: Map<number, number[]>,
  visibleIds: Set<number>,
) {
  const person = personsById.get(personId);
  if (!person) return null;
  if (visibleIds.has(person.id)) return person.id;

  const sentinelSpouseId = spouseIdsByPersonId
    .get(person.id)
    ?.find(
      (spouseId) =>
        visibleIds.has(spouseId) && isSentinelPerson(personsById.get(spouseId)),
    );

  return sentinelSpouseId ?? null;
}

type RelationLabels = {
  father: string;
  mother: string;
  husband: string;
  wife: string;
  spouse: string;
  son: string;
  daughter: string;
  child: string;
};

function buildParentRelations(
  person: TreePerson,
  personsById: Map<number, TreePerson>,
  labels: RelationLabels,
) {
  const parents: Array<{ person: TreePerson; role: string }> = [];
  const father = person.parentMarriage?.firstPartnerId
    ? personsById.get(person.parentMarriage.firstPartnerId)
    : null;
  const mother = person.parentMarriage?.secondPartnerId
    ? personsById.get(person.parentMarriage.secondPartnerId)
    : null;

  if (father) parents.push({ person: father, role: labels.father });
  if (mother) parents.push({ person: mother, role: labels.mother });

  return parents;
}

function buildSpouseRelations(
  person: TreePerson,
  personsById: Map<number, TreePerson>,
  spouseIdsByPersonId: Map<number, number[]>,
  labels: RelationLabels,
) {
  return (spouseIdsByPersonId.get(person.id) ?? [])
    .map((spouseId) => personsById.get(spouseId))
    .filter((spouse): spouse is TreePerson => spouse !== undefined)
    .map((spouse) => ({
      person: spouse,
      role:
        spouse.isMale === true
          ? labels.husband
          : spouse.isMale === false
            ? labels.wife
            : labels.spouse,
    }));
}

function buildChildRelations(
  person: TreePerson,
  childrenByParentId: Map<number, TreePerson[]>,
  labels: RelationLabels,
) {
  return (childrenByParentId.get(person.id) ?? []).map((child) => ({
    person: child,
    role:
      child.isMale === true
        ? labels.son
        : child.isMale === false
          ? labels.daughter
          : labels.child,
  }));
}

function buildVisibleTree(
  persons: TreePerson[],
  childrenByParentId: Map<number, TreePerson[]>,
) {
  const visibleIds = new Set<number>();
  const queue = persons.filter(isSentinelPerson).map((person) => person.id);

  while (queue.length) {
    const personId = queue.shift();
    if (!personId || visibleIds.has(personId)) continue;

    visibleIds.add(personId);

    for (const child of childrenByParentId.get(personId) ?? []) {
      queue.push(child.id);
    }
  }

  const people = persons.filter((person) => visibleIds.has(person.id));
  const parentByChild = new Map<number, number>();

  for (const person of people) {
    const fatherId = person.parentMarriage?.firstPartnerId ?? null;
    const motherId = person.parentMarriage?.secondPartnerId ?? null;

    if (fatherId && visibleIds.has(fatherId)) {
      parentByChild.set(person.id, fatherId);
    } else if (motherId && visibleIds.has(motherId)) {
      parentByChild.set(person.id, motherId);
    }
  }

  return { people, visibleIds, parentByChild };
}

function getAncestorPathIds(
  personId: number | null,
  parentByChild: Map<number, number>,
) {
  const path = new Set<number>();
  if (personId === null) return path;

  let current: number | undefined = personId;
  while (current !== undefined && !path.has(current)) {
    path.add(current);
    current = parentByChild.get(current);
  }

  return path;
}

function defaultEdgeStyle(): CSSProperties {
  return {
    stroke: "color-mix(in oklch, var(--foreground) 32%, transparent)",
    strokeWidth: 1.35,
  };
}

function highlightedEdgeStyle(isSelectedPath: boolean, isHoverPath: boolean) {
  if (isSelectedPath) {
    return { stroke: "var(--primary)", strokeWidth: 2.3 };
  }

  if (isHoverPath) {
    return { stroke: "rgb(217 158 38)", strokeWidth: 2.3 };
  }

  return defaultEdgeStyle();
}

async function layoutTree(nodes: FamilyNode[], edges: Edge[]) {
  const elk = new ELK();
  const depthByNodeId = buildDepthLookup(nodes, edges);
  const graph: ElkNode = {
    id: "zlitni-tree",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.edgeRouting": "SPLINES",
      "elk.spacing.nodeNode": "104",
      "elk.layered.spacing.nodeNodeBetweenLayers": "190",
      "elk.layered.spacing.edgeNodeBetweenLayers": "48",
      "elk.layered.spacing.edgeEdgeBetweenLayers": "30",
      "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
      "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layoutedGraph = await elk.layout(graph);
  const positions = new Map(
    layoutedGraph.children?.map((node) => [
      node.id,
      { x: node.x ?? 0, y: node.y ?? 0 },
    ]) ?? [],
  );

  return nodes.map((node) => ({
    ...node,
    position: addOrganicOffset(
      positions.get(node.id) ?? node.position,
      node.id,
      depthByNodeId.get(node.id) ?? 0,
    ),
  }));
}

function buildDepthLookup(nodes: FamilyNode[], edges: Edge[]) {
  const parentByChild = new Map(
    edges.map((edge) => [edge.target, edge.source]),
  );
  const depthByNodeId = new Map<string, number>();

  function depthFor(nodeId: string): number {
    const existing = depthByNodeId.get(nodeId);
    if (existing !== undefined) return existing;

    const parentId = parentByChild.get(nodeId);
    const depth = parentId ? depthFor(parentId) + 1 : 0;
    depthByNodeId.set(nodeId, depth);
    return depth;
  }

  for (const node of nodes) {
    depthFor(node.id);
  }

  return depthByNodeId;
}

function seededWave(seed: number) {
  return Math.sin(seed * 12.9898) * 43758.5453;
}

function addOrganicOffset(
  position: { x: number; y: number },
  nodeId: string,
  depth: number,
) {
  const numericId = Number(nodeId);
  const seed = Number.isFinite(numericId) ? numericId : nodeId.length;
  const sway = seededWave(seed);
  const alternate = seed % 2 === 0 ? 1 : -1;
  const horizontalDrift =
    depth === 0
      ? 0
      : Math.sin(seed * 0.73 + depth * 1.41) * 26 +
        alternate * (18 + Math.abs(sway % 14));
  const verticalDrift = depth === 0 ? 0 : Math.cos(seed * 0.43 + depth) * 14;

  return {
    x: position.x + horizontalDrift,
    y: position.y + verticalDrift,
  };
}

function TreePanel({
  person,
  paternalLine,
  parents,
  spouses,
  childItems,
  onFocusPerson,
}: {
  person: TreePerson;
  paternalLine: string;
  parents: Array<{ person: TreePerson; role: string }>;
  spouses: Array<{ person: TreePerson; role: string }>;
  childItems: Array<{ person: TreePerson; role: string }>;
  onFocusPerson: (personId: number) => void;
}) {
  const t = useTranslations("Home");
  const locale = useLocale();
  const dragControls = useDragControls();
  const unknown = t("unknown");
  const birth = formatLifeEvent(
    {
      year: person.birthYear,
      month: person.birthMonth,
      day: person.birthDay,
      city: person.birthCity,
      countryCode: person.birthCountryCode,
    },
    locale,
    unknown,
  );
  const death = formatLifeEvent(
    {
      year: person.deathYear,
      month: person.deathMonth,
      day: person.deathDay,
      city: person.deathCity,
      countryCode: person.deathCountryCode,
    },
    locale,
    unknown,
  );
  const gender =
    person.isMale === true
      ? t("genderMale")
      : person.isMale === false
        ? t("genderFemale")
        : unknown;
  const firstName = formatPersonFirstNameForLocale(person, locale) || unknown;
  const lastName = formatPersonLastNameForLocale(person, locale) || unknown;
  const age = calculateAge(person, unknown, (value) =>
    t("ageApprox", { age: value }),
  );

  return (
    <motion.aside
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 14, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      drag
      dragControls={dragControls}
      dragElastic={0}
      dragListener={false}
      dragMomentum={false}
      className="border-border bg-card/92 pointer-events-auto absolute right-3 bottom-16 z-30 max-h-[calc(100vh-7rem)] w-[min(28rem,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border p-4 shadow-2xl shadow-black/12 backdrop-blur-xl dark:shadow-black/35"
    >
      <div
        className="border-border cursor-grab touch-none border-b pb-3 active:cursor-grabbing"
        onPointerDown={(event) => dragControls.start(event)}
      >
        <p className="text-muted-foreground font-mono text-xs">#{person.id}</p>
        <h2 className="mt-0.5 text-lg font-semibold">
          {formatPersonNameForLocale(person, locale)}
        </h2>
      </div>

      <section className="pt-3">
        <h3 className="text-base font-semibold">{t("paternalLine")}</h3>
        <p className="text-muted-foreground mt-2 text-sm leading-6 font-medium">
          {paternalLine}
        </p>
      </section>

      <section className="mt-5">
        <h3 className="text-base font-semibold">{t("identity")}</h3>
        <dl className="mt-2.5 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
          <IdentityRow label={t("gender")} value={gender} />
          <IdentityRow label={t("firstName")} value={firstName} />
          <IdentityRow label={t("lastName")} value={lastName} />
          <IdentityRow label={t("age")} value={age} />
          <IdentityRow label={t("birth")} value={birth} />
          {hasDeathData(person) ? (
            <IdentityRow label={t("death")} value={death} />
          ) : null}
        </dl>
      </section>

      <div className="mt-5 space-y-5">
        <RelationSection
          title={t("parents")}
          items={parents}
          onFocusPerson={onFocusPerson}
        />
        <RelationSection
          title={t("spouses")}
          count={spouses.length}
          items={spouses}
          onFocusPerson={onFocusPerson}
        />
        <RelationSection
          title={t("children")}
          count={childItems.length}
          items={childItems}
          onFocusPerson={onFocusPerson}
        />
      </div>
    </motion.aside>
  );
}

function IdentityRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium break-words">{value}</dd>
    </>
  );
}

function RelationSection({
  title,
  count,
  items,
  onFocusPerson,
}: {
  title: string;
  count?: number;
  items: Array<{ person: TreePerson; role: string }>;
  onFocusPerson: (personId: number) => void;
}) {
  if (!items.length) return null;

  return (
    <section>
      <h3 className="flex items-baseline gap-2 text-base font-semibold">
        {count !== undefined ? (
          <span className="text-primary text-sm font-medium">{count}</span>
        ) : null}
        {title}
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <PersonRelationButton
            key={`${item.role}-${item.person.id}`}
            person={item.person}
            role={item.role}
            onClick={() => onFocusPerson(item.person.id)}
          />
        ))}
      </div>
    </section>
  );
}

function PersonRelationButton({
  person,
  role,
  onClick,
}: {
  person: TreePerson;
  role: string;
  onClick: () => void;
}) {
  const locale = useLocale();
  const name = formatPersonNameForLocale(person, locale);
  const initial = (
    formatPersonFirstNameForLocale(person, locale)[0] ||
    name[0] ||
    "?"
  ).toUpperCase();

  return (
    <button
      type="button"
      className="border-border bg-background/35 hover:bg-muted/60 focus-visible:ring-ring inline-flex min-h-10 max-w-full items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-start shadow-sm transition-colors outline-none focus-visible:ring-2"
      onClick={onClick}
    >
      <span className="border-border bg-card flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold">
        {initial}
      </span>
      <span className="min-w-0 truncate text-sm font-semibold">{name}</span>
      <span className="text-muted-foreground shrink-0 text-xs font-semibold">
        ({role})
      </span>
    </button>
  );
}

function FamilyTreeInner(
  { authenticated }: { authenticated: boolean },
  ref: ForwardedRef<FamilyTreeHandle>,
) {
  const t = useTranslations("Home");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [persons, setPersons] = useState<TreePerson[]>([]);
  const [marriages, setMarriages] = useState<TreeMarriage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<FamilyNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const reactFlow = useReactFlow();
  const didFitInitialTree = useRef(false);
  const personsById = useMemo(
    () => new Map(persons.map((person) => [person.id, person])),
    [persons],
  );
  const spouseByPersonId = useMemo(
    () => buildSpouseLookup(marriages),
    [marriages],
  );
  const spouseIdsByPersonId = useMemo(
    () => buildSpouseIdLookup(marriages),
    [marriages],
  );
  const childrenByParentId = useMemo(
    () => buildChildrenLookup(persons),
    [persons],
  );
  const visibleTree = useMemo(
    () => buildVisibleTree(persons, childrenByParentId),
    [childrenByParentId, persons],
  );
  const selectedPerson = selectedId ? personsById.get(selectedId) : null;
  const focusParam = searchParams.get("focus");
  const relationLabels = useMemo<RelationLabels>(
    () => ({
      father: t("father"),
      mother: t("mother"),
      husband: t("husband"),
      wife: t("wife"),
      spouse: t("spouse"),
      son: t("son"),
      daughter: t("daughter"),
      child: t("child"),
    }),
    [t],
  );
  const lineageConnectors = useMemo(
    () => ({
      sonOf: t("sonOf"),
      daughterOf: t("daughterOf"),
      childOf: t("childOf"),
    }),
    [t],
  );

  const focusPerson = useCallback(
    (personId: number) => {
      const node = reactFlow.getNode(String(personId));
      if (!node) return;

      setSelectedId(personId);
      void reactFlow.setCenter(
        node.position.x + NODE_WIDTH / 2,
        node.position.y + NODE_HEIGHT / 2,
        { zoom: 1, duration: 620 },
      );
    },
    [reactFlow],
  );

  const pushFocus = useCallback(
    (personId: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("focus", String(personId));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });

      const visiblePersonId = resolveVisibleFocusId(
        personId,
        personsById,
        spouseIdsByPersonId,
        visibleTree.visibleIds,
      );

      if (visiblePersonId) {
        window.requestAnimationFrame(() => focusPerson(visiblePersonId));
      }
    },
    [
      focusPerson,
      pathname,
      personsById,
      router,
      searchParams,
      spouseIdsByPersonId,
      visibleTree.visibleIds,
    ],
  );

  const clearFocus = useCallback(() => {
    setSelectedId(null);

    if (!focusParam) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("focus");
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }, [focusParam, pathname, router, searchParams]);

  useImperativeHandle(
    ref,
    () => ({
      fitView: () => {
        void reactFlow.fitView({
          padding: 0.18,
          duration: 700,
          includeHiddenNodes: false,
        });
      },
      focusPerson,
      pushFocus,
    }),
    [focusPerson, pushFocus, reactFlow],
  );

  useEffect(() => {
    if (!authenticated) {
      const timeoutId = window.setTimeout(() => {
        setPersons([]);
        setMarriages([]);
        setNodes([]);
        setEdges([]);
        setMessage(null);
        didFitInitialTree.current = false;
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    const controller = new AbortController();

    async function loadTree() {
      setIsLoading(true);
      setMessage(null);

      try {
        const response = await apiFetch("/api/tree", {
          method: "GET",
          auth: true,
          signal: controller.signal,
        });
        const data: TreeResponse = await response
          .json()
          .catch(() => ({ ok: false }));

        if (!response.ok || !data.ok || !data.persons || !data.marriages) {
          setMessage(data.message ?? t("treeLoadError"));
          return;
        }

        setPersons(data.persons);
        setMarriages(data.marriages);
        didFitInitialTree.current = false;
      } catch {
        if (!controller.signal.aborted) {
          setMessage(t("treeLoadError"));
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadTree();

    return () => controller.abort();
  }, [authenticated, setEdges, setNodes, t]);

  useEffect(() => {
    let cancelled = false;

    async function buildGraph() {
      const visiblePeople = visibleTree.people;
      const visibleIds = visibleTree.visibleIds;
      const visibleParentByChild = visibleTree.parentByChild;

      const baseNodes: FamilyNode[] = visiblePeople.map((person) => {
        const spouse = spouseByPersonId.get(person.id) ?? null;

        return {
          id: String(person.id),
          type: "familyPerson",
          position: { x: 0, y: 0 },
          data: {
            fullName: formatPersonNameForLocale(person, locale),
            birthText: person.birthYear ? String(person.birthYear) : "----",
            spouseName: spouse
              ? formatPersonNameForLocale(spouse, locale)
              : null,
            hasParents: visibleParentByChild.has(person.id),
            hasChildren: Boolean(
              childrenByParentId
                .get(person.id)
                ?.some((child) => visibleIds.has(child.id)),
            ),
            highlight: "none",
            active: false,
            dimmed: false,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        };
      });

      const baseEdges = visiblePeople.reduce<Edge[]>((items, person) => {
        const parentId = visibleParentByChild.get(person.id);
        if (!parentId) return items;

        items.push({
          id: `${parentId}-${person.id}`,
          source: String(parentId),
          target: String(person.id),
          type: "organic",
          animated: false,
          style: defaultEdgeStyle(),
        });

        return items;
      }, []);

      const layoutedNodes = await layoutTree(baseNodes, baseEdges);

      if (cancelled) return;

      setNodes(layoutedNodes);
      setEdges(baseEdges);
    }

    void buildGraph();

    return () => {
      cancelled = true;
    };
  }, [
    childrenByParentId,
    locale,
    setEdges,
    setNodes,
    spouseByPersonId,
    visibleTree,
  ]);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      const hoverPath = getAncestorPathIds(
        hoveredId,
        visibleTree.parentByChild,
      );
      const selectedPath = getAncestorPathIds(
        selectedId,
        visibleTree.parentByChild,
      );
      const activePath = selectedPath.size ? selectedPath : hoverPath;

      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const personId = Number(node.id);
          const isSelectedPath = selectedPath.has(personId);
          const isHoverPath = !isSelectedPath && hoverPath.has(personId);
          const hasAnyPath = activePath.size > 0;

          return {
            ...node,
            data: {
              ...node.data,
              highlight: isSelectedPath
                ? "selected"
                : isHoverPath
                  ? "hover"
                  : "none",
              active: selectedId === personId || hoveredId === personId,
              dimmed: hasAnyPath && !activePath.has(personId),
            },
          };
        }),
      );

      setEdges((currentEdges) =>
        currentEdges.map((edge) => {
          const sourceId = Number(edge.source);
          const targetId = Number(edge.target);
          const isSelectedPath =
            selectedPath.has(sourceId) && selectedPath.has(targetId);
          const isHoverPath =
            !isSelectedPath &&
            hoverPath.has(sourceId) &&
            hoverPath.has(targetId);

          return {
            ...edge,
            animated: isSelectedPath || isHoverPath,
            className: isSelectedPath
              ? "tree-edge--selected"
              : isHoverPath
                ? "tree-edge--hover"
                : undefined,
            style: highlightedEdgeStyle(isSelectedPath, isHoverPath),
          };
        }),
      );
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [hoveredId, selectedId, setEdges, setNodes, visibleTree.parentByChild]);

  useEffect(() => {
    if (!nodes.length || didFitInitialTree.current) return;

    didFitInitialTree.current = true;
    const animationFrame = window.requestAnimationFrame(() => {
      void reactFlow.fitView({ padding: 0.2, duration: 450 });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [nodes.length, reactFlow]);

  useEffect(() => {
    const requestedId = Number(focusParam);

    if (!Number.isInteger(requestedId) || requestedId <= 0 || !nodes.length) {
      return;
    }

    const visiblePersonId = resolveVisibleFocusId(
      requestedId,
      personsById,
      spouseIdsByPersonId,
      visibleTree.visibleIds,
    );

    if (!visiblePersonId) return;

    const animationFrame = window.requestAnimationFrame(() => {
      focusPerson(visiblePersonId);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [
    focusParam,
    focusPerson,
    nodes.length,
    personsById,
    spouseIdsByPersonId,
    visibleTree.visibleIds,
  ]);

  const panelPaternalLine =
    selectedPerson && personsById
      ? buildPaternalLine(
          selectedPerson,
          personsById,
          lineageConnectors,
          locale,
        )
      : null;
  const selectedParents = selectedPerson
    ? buildParentRelations(selectedPerson, personsById, relationLabels)
    : [];
  const selectedSpouses = selectedPerson
    ? buildSpouseRelations(
        selectedPerson,
        personsById,
        spouseIdsByPersonId,
        relationLabels,
      )
    : [];
  const selectedChildren = selectedPerson
    ? buildChildRelations(selectedPerson, childrenByParentId, relationLabels)
    : [];

  if (!authenticated) {
    return (
      <div className="absolute inset-0 grid place-items-center px-4">
        <div className="border-border bg-card/80 max-w-sm rounded-2xl border p-5 text-center shadow-xl shadow-black/8 backdrop-blur-xl dark:shadow-black/35">
          <p className="text-sm font-semibold">{t("treeLoginRequired")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="family-tree-flow absolute inset-0">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        minZoom={0.18}
        maxZoom={1.45}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        onPaneClick={clearFocus}
        onNodeMouseEnter={(_, node) => setHoveredId(Number(node.id))}
        onNodeMouseLeave={() => setHoveredId(null)}
        onNodeClick={(_, node) => pushFocus(Number(node.id))}
        className="bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.15}
          className="opacity-35"
        />
      </ReactFlow>

      {isLoading ? (
        <div className="border-border bg-background/85 absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-xl border px-4 py-2 text-sm font-semibold shadow-xl backdrop-blur-xl">
          {t("treeLoading")}
        </div>
      ) : null}
      {message ? (
        <div className="border-border bg-background/85 absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-xl border px-4 py-2 text-sm font-semibold shadow-xl backdrop-blur-xl">
          {message}
        </div>
      ) : null}
      {selectedPerson && panelPaternalLine ? (
        <TreePanel
          person={selectedPerson}
          paternalLine={panelPaternalLine}
          parents={selectedParents}
          spouses={selectedSpouses}
          childItems={selectedChildren}
          onFocusPerson={pushFocus}
        />
      ) : null}
    </div>
  );
}

const ForwardedFamilyTreeInner = forwardRef(FamilyTreeInner);

export const FamilyTreeFlow = forwardRef<
  FamilyTreeHandle,
  { authenticated: boolean }
>(function FamilyTreeFlow(props, ref) {
  return (
    <ReactFlowProvider>
      <ForwardedFamilyTreeInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
});
