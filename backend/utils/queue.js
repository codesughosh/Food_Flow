const ACTIVE_STATUSES = ["Preparing", "Cooking", "Ready"];
const KITCHEN_STATIONS = 2;
const STATUS_RANK = {
  Preparing: 1,
  Cooking: 2,
  Ready: 3,
  Completed: 4,
  Delivered: 5,
  Cancelled: 6
};
const STATUS_PROGRESS = {
  Preparing: 25,
  Cooking: 55,
  Ready: 85,
  Completed: 100,
  Delivered: 100,
  Cancelled: 0
};

function itemCount(items) {
  return items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
}

function estimatePrepMinutes(items) {
  const totalItems = itemCount(items);
  const uniqueItems = items.length;
  const baseMinutes = 6;
  const itemMinutes = totalItems * 4;
  const varietyMinutes = Math.max(0, uniqueItems - 1) * 2;

  return Math.min(60, Math.max(10, baseMinutes + itemMinutes + varietyMinutes));
}

function elapsedMinutes(order, now = new Date()) {
  return Math.max(0, (now.getTime() - new Date(order.createdAt).getTime()) / 60000);
}

function remainingPrepMinutes(order, now = new Date()) {
  if (["Ready", "Completed", "Delivered", "Cancelled"].includes(order.status)) return 0;
  return Math.max(0, Number(order.prepMinutes || order.estimatedMinutes || 20) - elapsedMinutes(order, now));
}

function statusFromProgress(order, now = new Date()) {
  if (["Completed", "Delivered", "Cancelled"].includes(order.status)) return order.status;

  const remaining = remainingPrepMinutes(order, now);
  const total = Number(order.prepMinutes || order.estimatedMinutes || 20);
  const progress = total > 0 ? Math.min(100, Math.round(((total - remaining) / total) * 100)) : 100;
  let timedStatus = "Preparing";

  if (remaining <= 0) timedStatus = "Ready";
  else if (progress >= 35) timedStatus = "Cooking";

  return STATUS_RANK[order.status] > STATUS_RANK[timedStatus] ? order.status : timedStatus;
}

function progressForOrder(order, now = new Date()) {
  if (["Completed", "Delivered"].includes(order.status)) return 100;
  if (order.status === "Cancelled") return 0;

  const remaining = remainingPrepMinutes(order, now);
  const total = Number(order.prepMinutes || order.estimatedMinutes || 20);
  const timedProgress = total > 0 ? Math.min(100, Math.max(5, Math.round(((total - remaining) / total) * 100))) : 100;
  return Math.max(STATUS_PROGRESS[order.status] || 5, timedProgress);
}

function activeWorkAhead(activeOrders, targetOrder, now = new Date()) {
  return activeOrders
    .filter(order => new Date(order.createdAt) < new Date(targetOrder.createdAt))
    .reduce((sum, order) => sum + remainingPrepMinutes(order, now), 0);
}

function buildQueueSnapshot(targetOrder, activeOrders, now = new Date()) {
  const active = activeOrders
    .filter(order => ACTIVE_STATUSES.includes(order.status))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const ordersAhead = active.filter(order => {
    return String(order._id) !== String(targetOrder._id)
      && new Date(order.createdAt) < new Date(targetOrder.createdAt)
      && remainingPrepMinutes(order, now) > 0;
  });

  const workAhead = activeWorkAhead(active, targetOrder, now);
  const ownRemaining = remainingPrepMinutes(targetOrder, now);
  const waitRawMinutes = (workAhead / KITCHEN_STATIONS) + ownRemaining;
  const waitMinutes = Math.ceil(waitRawMinutes);
  const waitSeconds = Math.ceil(waitRawMinutes * 60);
  const status = statusFromProgress(targetOrder, now);
  const progress = progressForOrder(targetOrder, now);
  const totalItems = itemCount(targetOrder.items || []);

  return {
    queueNumber: targetOrder.queueNumber,
    orderNumber: targetOrder.orderNumber,
    status,
    progress,
    estimatedMinutes: Math.max(0, waitMinutes),
    estimatedSeconds: Math.max(0, waitSeconds),
    ordersAhead: ordersAhead.length,
    activeOrders: active.length,
    totalItems,
    prepMinutes: Number(targetOrder.prepMinutes || targetOrder.estimatedMinutes || 20),
    kitchenStations: KITCHEN_STATIONS,
    updatedAt: now.toISOString()
  };
}

module.exports = {
  ACTIVE_STATUSES,
  estimatePrepMinutes,
  buildQueueSnapshot,
  progressForOrder,
  remainingPrepMinutes,
  statusFromProgress
};
