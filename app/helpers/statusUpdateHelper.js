module.exports = {
    updateStatusHistory:  function (statusHistory,orderStatus,dateTime) {
        var sortOrder = statusHistory.length + 1;
        var statusHistoryObj = {
            sortOrder,
            orderStatus : orderStatus,
            datetime : dateTime,
            isCompleted : true
        }
        statusHistory.push(statusHistoryObj);
        return statusHistory;
    }
  
}
