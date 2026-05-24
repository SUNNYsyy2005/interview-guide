# 深度学习

## 网络架构
- CNN：卷积操作、池化、感受野计算、经典网络（LeNet/AlexNet/VGG/ResNet/EfficientNet）
- RNN/LSTM/GRU：梯度消失/爆炸、门控机制、双向/多层设计
- Transformer：自注意力机制、多头注意力、位置编码、Encoder-Decoder 架构
- 残差连接：为什么有效、梯度直通、恒等映射

## 训练技巧
- 激活函数：ReLU/LeakyReLU/GELU/Swish 对比与选择
- BatchNorm/LayerNorm：前向/反向传播推导、训练 vs 推理区别
- Dropout：原理、训练/推理区别、与 BatchNorm 关系
- 学习率调度：Warmup、Cosine Annealing、Step Decay
- 优化器：SGD+Momentum、Adam、AdamW、LAMB 区别与适用场景

## 正则化与泛化
- 数据增强：MixUp、CutMix、RandAugment
- 权重衰减：L2 正则化 vs AdamW 解耦
- 早停法：验证集监控、patience 设置
- 标签平滑：原理与适用场景

## 损失函数
- 分类：交叉熵、Focal Loss、Label Smoothing
- 回归：MSE、MAE、Huber Loss
- 对比学习：InfoNCE、Triplet Loss、SimCLR/MoCo
