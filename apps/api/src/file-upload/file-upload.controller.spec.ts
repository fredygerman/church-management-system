import { Test, TestingModule } from "@nestjs/testing";
import { FileUploadController, MULTIPART_LIMITS } from "./file-upload.controller";
import { FileUploadService } from "./file-upload.service";
import { NotificationsService } from "../notifications/notifications.service";

describe("FileUploadController", () => {
  let controller: FileUploadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileUploadController],
      providers: [FileUploadService, { provide: NotificationsService, useValue: {} }],
    }).compile();

    controller = module.get<FileUploadController>(FileUploadController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("keeps every multipart receiver bounded by the configured policy", () => {
    expect(MULTIPART_LIMITS).toEqual(expect.objectContaining({
      fileSize: expect.any(Number),
      files: 1,
      fields: expect.any(Number),
      parts: expect.any(Number),
      fieldSize: expect.any(Number),
    }));
  });

  it("rejects an oversized file before the storage service is called", async () => {
    const upload = jest.spyOn((controller as any).fileUploadService, "handleFileUpload");
    await expect(
      controller.uploadFile(
        { size: MULTIPART_LIMITS.fileSize + 1, mimetype: "application/pdf" } as any,
        "too-large.pdf",
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { user: { id: "user-id" }, churchId: "church-id" } as any,
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(upload).not.toHaveBeenCalled();
  });
});
