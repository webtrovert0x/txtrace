// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BOTTxTrace
 * @dev On-chain transaction trace recording and verification publishing on Botchain Testnet (Chain ID 968).
 */
contract BOTTxTrace {
    struct TraceRequest {
        bytes32 requestId;
        bytes32 transactionHash;
        address requester;
        uint256 timestamp;
        bytes32 reportHash;
        bool fulfilled;
    }

    // Mapping from unique requestId to TraceRequest record
    mapping(bytes32 => TraceRequest) private _requests;

    // Ordered list of all requestIds for exploration
    bytes32[] private _allRequestIds;

    // Nonce counter to ensure unique request IDs even in the same block
    uint256 private _nonce;

    // Events
    event TraceRequested(
        bytes32 indexed requestId,
        bytes32 indexed transactionHash,
        address indexed requester,
        uint256 timestamp
    );

    event ResultPublished(
        bytes32 indexed requestId,
        bytes32 indexed reportHash,
        address indexed publisher,
        uint256 timestamp
    );

    /**
     * @notice Submit a transaction hash for tracing.
     * @param transactionHash The hash of the transaction to inspect.
     * @return requestId The unique tracking ID generated for this inspection request.
     */
    function requestTransactionTrace(bytes32 transactionHash) external returns (bytes32 requestId) {
        require(transactionHash != bytes32(0), "Invalid transaction hash");

        _nonce++;
        requestId = keccak256(
            abi.encodePacked(
                transactionHash,
                msg.sender,
                block.timestamp,
                _nonce
            )
        );

        TraceRequest storage req = _requests[requestId];
        req.requestId = requestId;
        req.transactionHash = transactionHash;
        req.requester = msg.sender;
        req.timestamp = block.timestamp;
        req.reportHash = bytes32(0);
        req.fulfilled = false;

        _allRequestIds.push(requestId);

        emit TraceRequested(requestId, transactionHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Retrieve details of an inspection request by requestId.
     * @param requestId Unique ID returned when the trace was requested.
     */
    function getRequest(bytes32 requestId) external view returns (TraceRequest memory) {
        TraceRequest memory req = _requests[requestId];
        require(req.requester != address(0), "Request does not exist");
        return req;
    }

    /**
     * @notice Publish the cryptographic report/result hash for a given inspection request.
     * @param requestId The ID of the trace request to fulfill.
     * @param reportHash The hash representing the verified execution trace report.
     */
    function publishResult(bytes32 requestId, bytes32 reportHash) external {
        TraceRequest storage req = _requests[requestId];
        require(req.requester != address(0), "Request does not exist");
        require(reportHash != bytes32(0), "Invalid report hash");

        req.reportHash = reportHash;
        req.fulfilled = true;

        emit ResultPublished(requestId, reportHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Returns total number of trace requests recorded.
     */
    function totalRequests() external view returns (uint256) {
        return _allRequestIds.length;
    }

    /**
     * @notice Returns a list of the most recent request IDs (up to limit).
     */
    function getRecentRequests(uint256 limit) external view returns (bytes32[] memory) {
        uint256 total = _allRequestIds.length;
        if (limit > total) {
            limit = total;
        }
        bytes32[] memory recent = new bytes32[](limit);
        for (uint256 i = 0; i < limit; i++) {
            recent[i] = _allRequestIds[total - 1 - i];
        }
        return recent;
    }
}

