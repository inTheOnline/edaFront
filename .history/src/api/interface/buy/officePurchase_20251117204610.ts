@TableName("office_purchase")
public class OfficePurchase {
    private Integer id;
    private Integer applyUserId;
    private String itemName;
    private String itemSpec;
    private String itemUnit;
    private Integer itemNumber;
    private Integer itemFileId;
    private String applyReason;
    private LocalDate expectedDate;
    private Integer uphold;
    private String status;
    private String remark;
    private LocalDateTime createdTime;
    private LocalDateTime updatedTime;
}
