# 计算机系统与工程

## 操作系统
- 进程/线程/协程：区别、调度算法、上下文切换开销
- 内存管理：虚拟内存、页表、TLB、缺页中断、内存映射
- 文件系统：inode、日志文件系统、ext4/xfs 区别
- I/O 模型：阻塞/非阻塞/多路复用（select/poll/epoll）、io_uring
- 锁机制：互斥锁/自旋锁/读写锁/乐观锁/悲观锁、死锁条件

## 计算机网络
- TCP：三次握手/四次挥手、拥塞控制（慢启动/拥塞避免/快重传/快恢复）
- TCP vs UDP：可靠性、适用场景、QUIC 协议
- HTTP/1.1 vs HTTP/2 vs HTTP/3：多路复用、头部压缩、QUIC
- HTTPS：TLS 握手、证书链、对称/非对称加密
- DNS：递归/迭代查询、DNS 缓存、DNS over HTTPS

## 数据库
- 索引：B+ 树 vs LSM 树、聚簇/非聚簇索引、覆盖索引、联合索引
- 事务：ACID、隔离级别（读未提交/读已提交/可重复读/串行化）
- MVCC：实现原理、Read View、Undo Log
- 日志：Redo Log/Undo Log/Binlog 区别与协作
- 分库分表：水平/垂直拆分、分片策略、跨分片查询

## 分布式系统
- CAP 定理：一致性/可用性/分区容忍权衡
- 一致性协议：Raft（Leader 选举/日志复制）、Paxos、ZAB
- 分布式事务：2PC/3PC、TCC、Saga、最终一致性
- 分布式锁：Redis RedLock、Zookeeper、etcd
- 消息队列：Kafka/RocketMQ/RabbitMQ 对比、消息丢失/重复/顺序

## 并发与性能
- 并发模型：CSP/Actor/Reactive、Go 协程/Java 虚拟线程
- 线程池：核心参数、拒绝策略、调优策略
- 缓存：一致性哈希、缓存穿透/击穿/雪崩、多级缓存
- 性能分析：火焰图、pprof、JFR、链路追踪
