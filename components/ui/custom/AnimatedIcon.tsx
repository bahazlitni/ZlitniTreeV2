"use client";

import { motion, type Variants } from "framer-motion";
import {
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell,
  Bookmark,
  Box,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  Clipboard,
  Clock,
  Cloud,
  CloudRain,
  Compass,
  Copy,
  CreditCard,
  Cpu,
  Database,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  File,
  FileText,
  Filter,
  Flame,
  Folder,
  FolderOpen,
  Gift,
  Globe,
  Heart,
  Home,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  Link,
  LoaderCircle,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Map as MapIcon,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  MicOff,
  Minus,
  Moon,
  Navigation,
  Package,
  Paperclip,
  Pause,
  Pencil,
  Phone,
  Play,
  Plus,
  RefreshCcw,
  Rocket,
  RotateCcw,
  Save,
  Search,
  Send,
  Server,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Truck,
  Unlock,
  Upload,
  User,
  Users,
  Volume2,
  VolumeX,
  Wallet,
  Wifi,
  WifiOff,
  X,
  Scaling,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { Size } from "@/lib/global-types";

export type AnimatedIconName =
  | "scaling"
  | "arrow-right"
  | "arrow-left"
  | "arrow-up"
  | "arrow-down"
  | "chevron-right"
  | "chevron-left"
  | "chevron-up"
  | "chevron-down"
  | "send"
  | "rocket"
  | "navigation"
  | "share"
  | "external-link"
  | "mail"
  | "phone"
  | "message"
  | "heart"
  | "star"
  | "sparkles"
  | "flame"
  | "zap"
  | "cart"
  | "bag"
  | "credit-card"
  | "wallet"
  | "gift"
  | "package"
  | "truck"
  | "box"
  | "plus"
  | "minus"
  | "x"
  | "check"
  | "trash"
  | "search"
  | "filter"
  | "sliders"
  | "menu"
  | "user"
  | "users"
  | "settings"
  | "refresh"
  | "rotate"
  | "loader"
  | "bell"
  | "home"
  | "download"
  | "upload"
  | "inbox"
  | "eye"
  | "eye-off"
  | "lock"
  | "unlock"
  | "shield"
  | "shield-check"
  | "key"
  | "login"
  | "logout"
  | "copy"
  | "clipboard"
  | "pencil"
  | "save"
  | "paperclip"
  | "link"
  | "calendar"
  | "clock"
  | "camera"
  | "image"
  | "play"
  | "pause"
  | "globe"
  | "map-pin"
  | "map"
  | "compass"
  | "info"
  | "alert"
  | "help"
  | "database"
  | "server"
  | "cpu"
  | "wifi"
  | "wifi-off"
  | "volume"
  | "volume-off"
  | "mic"
  | "mic-off"
  | "sun"
  | "moon"
  | "cloud"
  | "cloud-rain"
  | "file"
  | "file-text"
  | "folder"
  | "folder-open"
  | "archive"
  | "bookmark"
  | "thumbs-up"
  | "thumbs-down";

type IconAnimationGroup =
  | "direction"
  | "chevron"
  | "flight"
  | "communication"
  | "love"
  | "magic"
  | "energy"
  | "commerce"
  | "delivery"
  | "addRemove"
  | "destructive"
  | "search"
  | "filters"
  | "menu"
  | "confirm"
  | "people"
  | "settings"
  | "spinner"
  | "notification"
  | "home"
  | "transfer"
  | "visibility"
  | "security"
  | "auth"
  | "utility"
  | "time"
  | "media"
  | "playback"
  | "location"
  | "status"
  | "tech"
  | "audio"
  | "weather"
  | "files"
  | "positive";

export interface AnimatedIconProps {
  icon: AnimatedIconName;
  size: Size;
  className?: string;

  /**
   * self   => icon animates when hovering the icon itself
   * parent => icon animates when a parent motion component uses whileHover="hover"
   * loop   => icon constantly uses its hover animation, useful for loaders
   */
  trigger?: "self" | "parent" | "loop";

  /**
   * Adds aria-label to the wrapper.
   * Leave empty for decorative icons.
   */
  title?: string;
}

const iconRegistry: Record<AnimatedIconName, LucideIcon> = {
  "scaling": Scaling,
  "arrow-right": ArrowRight,
  "arrow-left": ArrowLeft,
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,

  "chevron-right": ChevronRight,
  "chevron-left": ChevronLeft,
  "chevron-up": ChevronUp,
  "chevron-down": ChevronDown,

  send: Send,
  rocket: Rocket,
  navigation: Navigation,
  share: Share2,
  "external-link": ExternalLink,

  mail: Mail,
  phone: Phone,
  message: MessageCircle,

  heart: Heart,
  star: Star,
  sparkles: Sparkles,
  flame: Flame,
  zap: Zap,

  cart: ShoppingCart,
  bag: ShoppingBag,
  "credit-card": CreditCard,
  wallet: Wallet,
  gift: Gift,

  package: Package,
  truck: Truck,
  box: Box,

  plus: Plus,
  minus: Minus,
  x: X,
  check: Check,
  trash: Trash2,

  search: Search,
  filter: Filter,
  sliders: SlidersHorizontal,
  menu: Menu,

  user: User,
  users: Users,

  settings: Settings,
  refresh: RefreshCcw,
  rotate: RotateCcw,
  loader: LoaderCircle,

  bell: Bell,
  home: Home,

  download: Download,
  upload: Upload,
  inbox: Inbox,

  eye: Eye,
  "eye-off": EyeOff,

  lock: Lock,
  unlock: Unlock,
  shield: Shield,
  "shield-check": ShieldCheck,
  key: KeyRound,

  login: LogIn,
  logout: LogOut,

  copy: Copy,
  clipboard: Clipboard,
  pencil: Pencil,
  save: Save,
  paperclip: Paperclip,
  link: Link,

  calendar: Calendar,
  clock: Clock,

  camera: Camera,
  image: ImageIcon,
  play: Play,
  pause: Pause,

  globe: Globe,
  "map-pin": MapPin,
  map: MapIcon,
  compass: Compass,

  info: CircleHelp,
  alert: AlertTriangle,
  help: CircleHelp,

  database: Database,
  server: Server,
  cpu: Cpu,
  wifi: Wifi,
  "wifi-off": WifiOff,

  volume: Volume2,
  "volume-off": VolumeX,
  mic: Mic,
  "mic-off": MicOff,

  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  "cloud-rain": CloudRain,

  file: File,
  "file-text": FileText,
  folder: Folder,
  "folder-open": FolderOpen,
  archive: Archive,

  bookmark: Bookmark,
  "thumbs-up": ThumbsUp,
  "thumbs-down": ThumbsDown,
};

const iconGroups: Record<AnimatedIconName, IconAnimationGroup> = {
  "arrow-right": "direction",
  "arrow-left": "direction",
  "arrow-up": "direction",
  "arrow-down": "direction",

  "chevron-right": "chevron",
  "chevron-left": "chevron",
  "chevron-up": "chevron",
  "chevron-down": "chevron",

  send: "flight",
  rocket: "flight",
  navigation: "flight",
  share: "flight",
  "external-link": "flight",

  mail: "communication",
  phone: "communication",
  message: "communication",

  heart: "love",
  star: "magic",
  sparkles: "magic",
  flame: "energy",
  zap: "energy",

  cart: "commerce",
  bag: "commerce",
  "credit-card": "commerce",
  wallet: "commerce",
  gift: "positive",

  package: "delivery",
  truck: "delivery",
  box: "delivery",

  plus: "addRemove",
  minus: "addRemove",
  x: "destructive",
  check: "confirm",
  trash: "destructive",

  search: "search",
  filter: "filters",
  sliders: "filters",
  menu: "menu",

  user: "people",
  users: "people",

  settings: "settings",
  refresh: "spinner",
  rotate: "spinner",
  loader: "spinner",

  bell: "notification",
  home: "home",

  download: "transfer",
  upload: "transfer",
  inbox: "transfer",

  eye: "visibility",
  "eye-off": "visibility",

  lock: "security",
  unlock: "security",
  shield: "security",
  "shield-check": "security",
  key: "security",

  login: "auth",
  logout: "auth",

  copy: "utility",
  clipboard: "utility",
  pencil: "utility",
  save: "utility",
  paperclip: "utility",
  link: "utility",
  scaling: "utility",

  calendar: "time",
  clock: "time",

  camera: "media",
  image: "media",
  play: "playback",
  pause: "playback",

  globe: "location",
  "map-pin": "location",
  map: "location",
  compass: "location",

  info: "status",
  alert: "status",
  help: "status",

  database: "tech",
  server: "tech",
  cpu: "tech",
  wifi: "tech",
  "wifi-off": "tech",

  volume: "audio",
  "volume-off": "audio",
  mic: "audio",
  "mic-off": "audio",

  sun: "weather",
  moon: "weather",
  cloud: "weather",
  "cloud-rain": "weather",

  file: "files",
  "file-text": "files",
  folder: "files",
  "folder-open": "files",
  archive: "files",

  bookmark: "positive",
  "thumbs-up": "positive",
  "thumbs-down": "destructive",
};

const iconSizeConfig: Record<
  Size,
  {
    px: number;
    stroke: number;
    move: number;
    lift: number;
    rotate: number;
    hoverScale: number;
    tapScale: number;
  }
> = {
  xs: {
    px: 14,
    stroke: 2.25,
    move: 2,
    lift: 2,
    rotate: 7,
    hoverScale: 1.08,
    tapScale: 0.94,
  },
  sm: {
    px: 16,
    stroke: 2.25,
    move: 3,
    lift: 3,
    rotate: 9,
    hoverScale: 1.09,
    tapScale: 0.93,
  },
  md: {
    px: 18,
    stroke: 2.35,
    move: 4,
    lift: 4,
    rotate: 11,
    hoverScale: 1.1,
    tapScale: 0.92,
  },
  lg: {
    px: 20,
    stroke: 2.4,
    move: 5,
    lift: 5,
    rotate: 13,
    hoverScale: 1.11,
    tapScale: 0.91,
  },
  xl: {
    px: 24,
    stroke: 2.45,
    move: 7,
    lift: 7,
    rotate: 16,
    hoverScale: 1.12,
    tapScale: 0.9,
  },
  "2xl": {
    px: 30,
    stroke: 2.5,
    move: 9,
    lift: 9,
    rotate: 20,
    hoverScale: 1.14,
    tapScale: 0.88,
  },
};

function spring(stiffness = 420, damping = 16, mass = 0.7) {
  return {
    type: "spring",
    stiffness,
    damping,
    mass,
  } as const;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getDirectionalMultiplier(icon: AnimatedIconName) {
  switch (icon) {
    case "arrow-left":
    case "chevron-left":
    case "logout":
      return { x: -1, y: 0 };

    case "arrow-up":
    case "chevron-up":
    case "upload":
      return { x: 0, y: -1 };

    case "arrow-down":
    case "chevron-down":
    case "download":
      return { x: 0, y: 1 };

    default:
      return { x: 1, y: 0 };
  }
}

function buildIconVariants(icon: AnimatedIconName, size: Size): Variants {
  const cfg = iconSizeConfig[size];
  const group = iconGroups[icon];
  const dir = getDirectionalMultiplier(icon);

  const rest = {
    x: 0,
    y: 0,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    rotate: 0,
    rotateX: 0,
    rotateY: 0,
    opacity: 1,
  };

  const tap = {
    scale: cfg.tapScale,
    transition: spring(680, 22, 0.55),
  };

  switch (group) {
    case "direction":
      return {
        rest,
        hover: {
          x: [0, dir.x * cfg.move, dir.x * cfg.move * 1.8, 0],
          y: [0, dir.y * cfg.move, dir.y * cfg.move * 1.8, 0],
          scale: [1, cfg.hoverScale, 1],
          transition: {
            duration: 0.5,
            ease: "easeOut",
          },
        },
        tap,
      };

    case "chevron":
      return {
        rest,
        hover: {
          x: [0, dir.x * cfg.move, 0, dir.x * cfg.move * 0.75, 0],
          y: [0, dir.y * cfg.move, 0, dir.y * cfg.move * 0.75, 0],
          scale: [1, cfg.hoverScale, 1],
          transition: {
            duration: 0.55,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "flight":
      return {
        rest,
        hover: {
          x: [0, cfg.move * 0.9, cfg.move * 2.1, 0],
          y: [0, -cfg.lift * 0.9, -cfg.lift * 1.55, 0],
          rotate: [0, -cfg.rotate * 0.4, cfg.rotate * 0.9, 0],
          scale: [1, cfg.hoverScale, 0.98, 1],
          transition: {
            duration: icon === "rocket" ? 0.72 : 0.6,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "communication":
      return {
        rest,
        hover: {
          x: [0, -cfg.move * 0.5, cfg.move * 0.5, -cfg.move * 0.25, 0],
          y: [0, -cfg.lift * 0.4, 0],
          rotate: [0, -cfg.rotate, cfg.rotate, -cfg.rotate * 0.5, 0],
          scale: [1, cfg.hoverScale, 1],
          transition: {
            duration: icon === "phone" ? 0.68 : 0.56,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "love":
      return {
        rest,
        hover: {
          scale: [1, 1.24, 0.92, 1.16, 1],
          y: [0, -cfg.lift * 0.35, 0],
          rotate: [0, -cfg.rotate * 0.5, cfg.rotate * 0.35, 0],
          transition: {
            duration: 0.7,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "magic":
      return {
        rest,
        hover: {
          rotate: [0, -cfg.rotate, cfg.rotate * 1.4, 0],
          scale: [1, 1.18, 0.95, 1.12, 1],
          y: [0, -cfg.lift * 0.65, 0],
          transition: {
            duration: 0.72,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "energy":
      return {
        rest,
        hover: {
          x: [0, -cfg.move * 0.4, cfg.move * 0.35, -cfg.move * 0.2, 0],
          y: [0, -cfg.lift * 0.3, cfg.lift * 0.15, -cfg.lift * 0.25, 0],
          rotate: [0, -cfg.rotate * 0.8, cfg.rotate * 0.9, -cfg.rotate * 0.35, 0],
          scale: [1, 1.16, 1.02, 1.12, 1],
          transition: {
            duration: 0.42,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "commerce":
      return {
        rest,
        hover: {
          x: [0, -cfg.move * 0.45, cfg.move * 0.65, 0],
          y: [0, -cfg.lift * 0.9, 0],
          rotate: [0, -cfg.rotate * 0.45, cfg.rotate * 0.35, 0],
          scale: [1, cfg.hoverScale, 1],
          transition: {
            duration: 0.58,
            ease: "easeOut",
          },
        },
        tap,
      };

    case "delivery":
      return {
        rest,
        hover: {
          x: [0, cfg.move * 0.6, cfg.move * 1.3, 0],
          y: [0, -cfg.lift * 0.35, 0, -cfg.lift * 0.2, 0],
          rotate: [0, cfg.rotate * 0.25, -cfg.rotate * 0.25, 0],
          scale: [1, cfg.hoverScale, 1],
          transition: {
            duration: icon === "truck" ? 0.72 : 0.58,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "addRemove":
      return {
        rest,
        hover:
          icon === "plus"
            ? {
                rotate: [0, 90, 180],
                scale: [1, 1.16, 1],
                transition: {
                  duration: 0.42,
                  ease: "easeOut",
                },
              }
            : {
                scaleX: [1, 1.35, 0.92, 1],
                scaleY: [1, 0.82, 1.12, 1],
                transition: {
                  duration: 0.4,
                  ease: "easeOut",
                },
              },
        tap,
      };

    case "destructive":
      return {
        rest,
        hover: {
          x: [0, -cfg.move * 0.45, cfg.move * 0.45, -cfg.move * 0.25, cfg.move * 0.2, 0],
          y: icon === "trash" ? [0, -cfg.lift * 0.5, cfg.lift * 0.35, 0] : [0, 0],
          rotate: [0, -cfg.rotate, cfg.rotate, -cfg.rotate * 0.6, cfg.rotate * 0.35, 0],
          scale: [1, 1.05, 0.97, 1],
          transition: {
            duration: 0.52,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "search":
      return {
        rest,
        hover: {
          x: [0, cfg.move * 0.75, -cfg.move * 0.45, 0],
          y: [0, -cfg.lift * 0.55, cfg.lift * 0.35, 0],
          rotate: [0, -cfg.rotate * 0.7, cfg.rotate * 0.45, 0],
          scale: [1, 1.12, 1],
          transition: {
            duration: 0.6,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "filters":
      return {
        rest,
        hover: {
          y: [0, -cfg.lift * 0.45, cfg.lift * 0.35, 0],
          rotate: [0, cfg.rotate * 0.3, -cfg.rotate * 0.3, 0],
          scaleX: [1, 1.12, 0.95, 1],
          scaleY: [1, 0.95, 1.1, 1],
          transition: {
            duration: 0.55,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "menu":
      return {
        rest,
        hover: {
          scaleX: [1, 1.22, 0.92, 1.08, 1],
          rotate: [0, cfg.rotate * 0.2, -cfg.rotate * 0.2, 0],
          transition: {
            duration: 0.5,
            ease: "easeOut",
          },
        },
        tap,
      };

    case "confirm":
      return {
        rest,
        hover: {
          x: [0, cfg.move * 0.25, 0],
          y: [0, -cfg.lift * 0.45, 0],
          rotate: [0, -cfg.rotate * 0.3, 0],
          scale: [1, 1.22, 0.94, 1.08, 1],
          transition: {
            duration: 0.58,
            ease: "easeOut",
          },
        },
        tap,
      };

    case "people":
      return {
        rest,
        hover: {
          x: [0, -cfg.move * 0.4, cfg.move * 0.4, 0],
          y: [0, -cfg.lift * 0.55, 0],
          scale: [1, cfg.hoverScale, 1],
          rotate: [0, -cfg.rotate * 0.25, cfg.rotate * 0.25, 0],
          transition: {
            duration: 0.56,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "settings":
      return {
        rest,
        hover: {
          rotate: 135,
          scale: cfg.hoverScale,
          transition: spring(360, 14, 0.65),
        },
        tap,
      };

    case "spinner":
      return {
        rest,
        hover:
          icon === "loader"
            ? {
                rotate: 360,
                transition: {
                  duration: 0.8,
                  ease: "linear",
                  repeat: Infinity,
                },
              }
            : {
                rotate: [0, -45, 360],
                scale: [1, 1.1, 1],
                transition: {
                  duration: 0.75,
                  ease: "easeInOut",
                },
              },
        tap,
      };

    case "notification":
      return {
        rest,
        hover: {
          rotate: [0, -cfg.rotate * 1.1, cfg.rotate * 1.1, -cfg.rotate * 0.75, cfg.rotate * 0.45, 0],
          y: [0, -cfg.lift * 0.55, 0],
          scale: [1, 1.08, 1],
          transition: {
            duration: 0.72,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "home":
      return {
        rest,
        hover: {
          y: [0, -cfg.lift, 0],
          scale: [1, 1.08, 1],
          rotate: [0, -cfg.rotate * 0.25, cfg.rotate * 0.25, 0],
          transition: {
            duration: 0.6,
            ease: "easeOut",
          },
        },
        tap,
      };

    case "transfer":
      return {
        rest,
        hover: {
          y:
            icon === "upload"
              ? [0, -cfg.lift, -cfg.lift * 1.7, 0]
              : [0, cfg.lift, cfg.lift * 1.7, 0],
          x: icon === "inbox" ? [0, cfg.move * 0.6, -cfg.move * 0.25, 0] : [0, 0],
          scale: [1, cfg.hoverScale, 0.98, 1],
          transition: {
            duration: 0.58,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "visibility":
      return {
        rest,
        hover: {
          scaleY: [1, 0.25, 1],
          opacity: [1, 0.72, 1],
          y: [0, -cfg.lift * 0.25, 0],
          transition: {
            duration: 0.45,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "security":
      return {
        rest,
        hover: {
          y: [0, -cfg.lift * 0.55, 0],
          rotate: icon === "key" ? [0, -cfg.rotate, cfg.rotate * 0.7, 0] : [0, -cfg.rotate * 0.35, cfg.rotate * 0.35, 0],
          scale: [1, 1.12, 1],
          transition: {
            duration: 0.58,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "auth":
      return {
        rest,
        hover: {
          x: icon === "logout" ? [0, -cfg.move, -cfg.move * 1.8, 0] : [0, cfg.move, cfg.move * 1.8, 0],
          y: [0, -cfg.lift * 0.35, 0],
          scale: [1, cfg.hoverScale, 1],
          transition: {
            duration: 0.54,
            ease: "easeOut",
          },
        },
        tap,
      };

    case "utility":
      return {
        rest,
        hover: {
          y: [0, -cfg.lift * 0.65, 0],
          rotate: [0, -cfg.rotate * 0.45, cfg.rotate * 0.35, 0],
          scale: [1, 1.1, 1],
          transition: {
            duration: 0.52,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "time":
      return {
        rest,
        hover: {
          rotate: icon === "clock" ? [0, 20, -15, 360] : [0, -cfg.rotate * 0.45, cfg.rotate * 0.45, 0],
          y: [0, -cfg.lift * 0.4, 0],
          scale: [1, 1.09, 1],
          transition: {
            duration: icon === "clock" ? 0.9 : 0.55,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "media":
      return {
        rest,
        hover: {
          scale: [1, 1.18, 0.96, 1.08, 1],
          y: [0, -cfg.lift * 0.4, 0],
          rotate: [0, -cfg.rotate * 0.35, cfg.rotate * 0.25, 0],
          transition: {
            duration: 0.55,
            ease: "easeOut",
          },
        },
        tap,
      };

    case "playback":
      return {
        rest,
        hover:
          icon === "play"
            ? {
                x: [0, cfg.move * 0.8, 0],
                scale: [1, 1.16, 1],
                transition: {
                  duration: 0.45,
                  ease: "easeOut",
                },
              }
            : {
                scaleY: [1, 1.3, 0.85, 1],
                scaleX: [1, 0.88, 1.08, 1],
                transition: {
                  duration: 0.42,
                  ease: "easeOut",
                },
              },
        tap,
      };

    case "location":
      return {
        rest,
        hover:
          icon === "globe"
            ? {
                rotate: [0, -cfg.rotate * 0.5, cfg.rotate * 0.5, 0],
                y: [0, -cfg.lift * 0.45, 0],
                scale: [1, 1.1, 1],
                transition: {
                  duration: 0.62,
                  ease: "easeInOut",
                },
              }
            : {
                y: [0, -cfg.lift * 1.2, 0, -cfg.lift * 0.45, 0],
                scale: [1, 1.12, 0.96, 1],
                rotate: [0, -cfg.rotate * 0.3, cfg.rotate * 0.3, 0],
                transition: {
                  duration: 0.72,
                  ease: "easeOut",
                },
              },
        tap,
      };

    case "status":
      return {
        rest,
        hover: {
          y: [0, -cfg.lift * 0.8, 0],
          rotate: icon === "alert" ? [0, -cfg.rotate, cfg.rotate, -cfg.rotate * 0.4, 0] : [0, -cfg.rotate * 0.4, cfg.rotate * 0.4, 0],
          scale: [1, 1.16, 0.98, 1],
          transition: {
            duration: icon === "alert" ? 0.64 : 0.52,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "tech":
      return {
        rest,
        hover: {
          scale: [1, 1.12, 0.98, 1.08, 1],
          y: [0, -cfg.lift * 0.35, 0],
          opacity: icon === "wifi-off" ? [1, 0.55, 1] : [1, 0.82, 1],
          rotate: [0, -cfg.rotate * 0.25, cfg.rotate * 0.25, 0],
          transition: {
            duration: 0.58,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "audio":
      return {
        rest,
        hover: {
          scale: [1, 1.18, 0.96, 1.1, 1],
          x: [0, -cfg.move * 0.25, cfg.move * 0.25, 0],
          rotate: icon.includes("off") ? [0, -cfg.rotate * 0.6, cfg.rotate * 0.35, 0] : [0, -cfg.rotate * 0.25, cfg.rotate * 0.25, 0],
          transition: {
            duration: 0.52,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "weather":
      return {
        rest,
        hover: {
          y: [0, -cfg.lift * 0.8, 0],
          x: icon === "cloud" || icon === "cloud-rain" ? [0, cfg.move * 0.6, -cfg.move * 0.35, 0] : [0, 0],
          rotate:
            icon === "sun"
              ? [0, 90, 180]
              : icon === "moon"
                ? [0, -cfg.rotate * 0.4, cfg.rotate * 0.2, 0]
                : [0, -cfg.rotate * 0.25, cfg.rotate * 0.25, 0],
          scale: [1, 1.12, 1],
          transition: {
            duration: icon === "sun" ? 0.7 : 0.6,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "files":
      return {
        rest,
        hover: {
          y: [0, -cfg.lift * 0.55, 0],
          rotateY: icon === "folder-open" ? [0, -18, 0] : [0, 0],
          rotate: [0, -cfg.rotate * 0.3, cfg.rotate * 0.25, 0],
          scale: [1, 1.08, 1],
          transition: {
            duration: 0.55,
            ease: "easeInOut",
          },
        },
        tap,
      };

    case "positive":
      return {
        rest,
        hover: {
          y: [0, -cfg.lift * 0.75, 0],
          scale: [1, 1.22, 0.94, 1.08, 1],
          rotate: [0, -cfg.rotate * 0.5, cfg.rotate * 0.35, 0],
          transition: {
            duration: 0.62,
            ease: "easeOut",
          },
        },
        tap,
      };

    default:
      return {
        rest,
        hover: {
          scale: cfg.hoverScale,
          y: -cfg.lift * 0.5,
          transition: spring(),
        },
        tap,
      };
  }
}

export default function AnimatedIcon({
  icon,
  size,
  className,
  trigger = "self",
  title,
}: AnimatedIconProps) {
  const Icon = iconRegistry[icon];
  const cfg = iconSizeConfig[size];
  const variants = buildIconVariants(icon, size);

  return (
    <motion.span
      className={cx(
        "inline-flex shrink-0 items-center justify-center align-middle text-current",
        className,
      )}
      style={{
        width: cfg.px,
        height: cfg.px,
        transformOrigin: "center",
      }}
      variants={variants}
      initial="rest"
      animate={trigger === "loop" ? "hover" : undefined}
      whileHover={trigger === "self" ? "hover" : undefined}
      whileTap={trigger === "self" ? "tap" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? "img" : undefined}
    >
      <Icon
        size={cfg.px}
        strokeWidth={cfg.stroke}
        aria-hidden="true"
        focusable="false"
      />
    </motion.span>
  );
}