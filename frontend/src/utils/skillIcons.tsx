import type { IconType } from 'react-icons';
import {
  TbSparkles,
  TbBrain,
} from 'react-icons/tb';
import {
  HiOutlineComputerDesktop,
  HiOutlineEye,
  HiOutlineChatBubbleLeftRight,
  HiOutlineRocketLaunch,
} from 'react-icons/hi2';
import { GiRobotGrab } from 'react-icons/gi';

/**
 * Skill ID → react-icons 图标映射
 * 保研面试研究方向
 * 未命中的 skill 使用后端返回的 emoji 作为兜底
 */
const SKILL_ICON_MAP: Record<string, IconType> = {
  'ml-deep-learning': TbBrain,                           // 机器学习与深度学习
  'llm-ai-app': HiOutlineChatBubbleLeftRight,            // 大语言模型与AI应用
  'cv-multimodal': HiOutlineEye,                         // 计算机视觉与多模态
  'systems-engineering': HiOutlineComputerDesktop,       // 计算机系统与工程
  'robotics-embodied': GiRobotGrab,                      // 机器人与具身智能
  'ai-application': HiOutlineRocketLaunch,               // AI 应用与创业
  'custom': TbSparkles,
};

/**
 * 根据 skillId 获取对应的 react-icons 图标组件
 * 返回 null 表示未命中，调用方应使用后端返回的 emoji 兜底
 */
export function getSkillIcon(skillId: string): IconType | null {
  return SKILL_ICON_MAP[skillId] ?? null;
}
