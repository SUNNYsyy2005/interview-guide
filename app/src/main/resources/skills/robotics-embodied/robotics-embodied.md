# 机器人与具身智能

## 机器人学基础
- 运动学：正/逆运动学（D-H 参数）、雅可比矩阵、奇异性分析
- 动力学：拉格朗日/牛顿-欧拉方法、惯性矩阵、重力补偿
- 控制基础：PID 控制、模型预测控制（MPC）、阻抗/导纳控制
- 传感器：激光雷达（LiDAR）、深度相机（D435/Kinect）、IMU、力/力矩传感器
- 通信中间件：ROS/ROS2 节点、Topic/Service/Action、DDS 通信

## SLAM 与定位建图
- 激光 SLAM：GMapping、Cartographer、LOAM/LeGO-LOAM、LIO-SAM
- 视觉 SLAM：ORB-SLAM3、VINS-Mono/Fusion、LSD-SLAM
- 前端：特征提取与匹配、光流法、ICP 点云配准
- 后端：图优化（g2o/GTSAM）、位姿图优化、Ceres Solver
- 回环检测：BoW（DBoW2）、NetVLAD、Scan Context
- 多传感器融合：激光+IMU（EKF/UKF）、视觉惯性里程计（VIO）

## 导航与路径规划
- 全局规划：A*、Dijkstra、RRT/RRT*、PRM
- 局部规划：DWA、TEB、MPC 局部规划器
- 代价地图：静态/障碍层、膨胀半径、3D 点云代价地图
- 动态避障：VFH、人工势场、深度学习避障
- 行为决策：有限状态机、行为树

## 机械臂操作
- 运动规划：MoveIt/MoveIt2、OMPL、RRT-Connect、PRM
- 抓取规划：GraspNet、力闭合分析、吸盘 vs 二指 vs 多指
- 力控：阻抗控制、力/位混合控制、柔顺控制
- 手眼标定：Eye-in-Hand vs Eye-to-Hand、AX=XB 求解
- 轨迹规划：关节空间 vs 笛卡尔空间、时间最优轨迹

## 具身智能
- 感知：3D 点云处理（PCL/Open3D）、语义分割、6DoF 位姿估计
- 决策：行为克隆（BC）、模仿学习、视觉-语言-动作模型（VLA）
- 大模型赋能：LLM 任务规划、VLM 场景理解、Code as Policy
- Sim2Real：域随机化、系统辨识、仿真到实物迁移
- 数据采集：遥操作、VR 示教、自动标注

## 强化学习与多智能体
- 经典算法：DQN、PPO、SAC、TD3、Model-Based RL
- 奖励设计：稀疏奖励、奖励塑形、逆强化学习（IRL）
- 多智能体：MAPPO、QMIX、通信学习、博弈论
- 仿真环境：Isaac Sim/Gym、MuJoCo、PyBullet、Gazebo
- Sim2Real 策略迁移：域随机化、Teacher-Student、Fine-tuning
