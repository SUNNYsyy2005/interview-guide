# 计算机视觉与多模态

## CV 基础
- 图像分类：CNN 经典网络演进（LeNet → AlexNet → VGG → ResNet → EfficientNet）
- 特征提取：卷积操作、池化、感受野计算、特征金字塔（FPN/PAN）
- 数据增强：几何变换、颜色扰动、MixUp、CutMix、Mosaic
- 评估指标：Top-1/Top-5 准确率、mAP、IoU、F1

## 目标检测
- 两阶段：R-CNN → Fast R-CNN → Faster R-CNN（RPN 原理）
- 单阶段：YOLO 系列演进（v1-v8）、SSD、RetinaNet（Focal Loss）
- Anchor-Free：FCOS、CenterNet、CornerNet
- NMS：标准 NMS、Soft-NMS、DIoU-NMS
- 损失函数：IoU/GIoU/DIoU/CIoU 对比

## 语义/实例分割
- 语义分割：FCN、U-Net、DeepLab 系列（ASPP、空洞卷积）
- 实例分割：Mask R-CNN、SOLOv2
- 全景分割：Panoptic FPN、Mask2Former
- SAM（Segment Anything）：提示机制、零样本泛化

## 多模态与跨模态
- CLIP：对比学习对齐、零样本分类、视觉-语言预训练
- 多模态大模型：LLaVA、Qwen-VL、GPT-4V 架构
- 跨模态融合：早期/晚期/注意力融合策略
- 视觉问答（VQA）：注意力机制、知识图谱增强

## 生成模型
- GAN：生成器/判别器、WGAN-GP、StyleGAN、模式坍塌
- 扩散模型：DDPM 原理、噪声调度、采样加速（DDIM）
- Stable Diffusion：Latent Diffusion、Text-to-Image、ControlNet
- 视频生成：Sora 类架构、时序建模

## 3D 视觉与视频理解
- 3D 表示：点云（PointNet/PointNet++）、NeRF、3D Gaussian Splatting
- 视频理解：时序建模（3D Conv、SlowFast、ViViT）、动作识别
